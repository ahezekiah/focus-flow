import { expect, type APIRequestContext, type Locator, type Page } from "@playwright/test";
import {
  AdminCreateUserCommand,
  AdminDisableUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DeleteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  API_BASE_URL,
  AUDIO_BUCKET,
  AUDIO_FILE_TABLE,
  AWS_REGION,
  PROVIDED_EMAIL,
  PROVIDED_PASSWORD,
  USER_POOL_ID,
} from "../support/api-config";
import type { AudioPayload } from "../support/audio-asset";

/**
 * The only layer that knows about Playwright, selectors, the API protocol and AWS.
 * Method names describe mechanisms, never intent — intent belongs in the DSL.
 */

/** A record as the API returns it. Only the fields the driver needs to act on. */
interface ApiRecord {
  id: string;
  name?: string;
  playUrl?: string;
  storageKey?: string;
}

/** Meets the pool's policy: 8+ characters with upper, lower, number and symbol. */
const ACCOUNT_PASSWORD = "E2e-Passw0rd!";
const RECORD_WAIT_MS = 15_000;
const RECORD_POLL_MS = 250;

/** Rows on the audio list are the list items carrying a "Play <name>" control. */
const PLAY_CONTROL = /^Play .+/;

function recordsIn(body: unknown): ApiRecord[] {
  if (!body || typeof body !== "object") return [];
  const payload = body as Record<string, unknown>;

  const candidates: unknown[] = Array.isArray(payload.audioFiles)
    ? payload.audioFiles
    : [payload.audioFile ?? payload];

  return candidates.filter(
    (candidate): candidate is ApiRecord =>
      !!candidate && typeof (candidate as ApiRecord).id === "string",
  );
}

export class FocusFlowBrowserDriver {
  /** Every record the API has mentioned this test, keyed by id. */
  private readonly seen = new Map<string, ApiRecord>();
  /** Ids this test created, so teardown only ever touches its own data. */
  private readonly created = new Set<string>();
  /** Accounts created here, so teardown never touches a pre-provisioned one. */
  private readonly accounts = new Set<string>();
  private account?: { email: string; password: string };
  private cognitoClient?: CognitoIdentityProviderClient;

  constructor(
    private readonly page: Page,
    private readonly api: APIRequestContext,
  ) {
    this.watchApiTraffic();
  }

  // ── Navigation ───────────────────────────────────────────────
  async open(routePath: string): Promise<void> {
    await this.page.goto(routePath);
  }

  async reload(): Promise<void> {
    await this.page.reload();
  }

  async clickNavItem(label: string): Promise<void> {
    await this.button(label).click();
  }

  // ── Forms and controls ───────────────────────────────────────
  async clickButtonByName(name: string): Promise<void> {
    await this.button(name).click();
  }

  /** For steps that must tolerate either starting screen. */
  async clickButtonIfPresent(name: string): Promise<void> {
    const control = this.button(name);
    if ((await control.count()) > 0) await control.click();
  }

  async fillInputByPlaceholder(placeholder: string, value: string): Promise<void> {
    await this.page.getByPlaceholder(placeholder, { exact: true }).fill(value);
  }

  /**
   * The picker is a hidden input. Scoped away from the multi-select uploader on the
   * music page so it stays unambiguous if both are ever mounted at once.
   */
  async chooseFile(payload: AudioPayload): Promise<void> {
    await this.page
      .locator('input[type="file"][accept="audio/*"]:not([multiple])')
      .setInputFiles({ name: payload.name, mimeType: payload.mimeType, buffer: payload.buffer });
  }

  // ── Waits and assertions on what is displayed ────────────────
  async waitForButton(name: string): Promise<void> {
    await expect(this.button(name)).toBeVisible();
  }

  async waitForText(text: string): Promise<void> {
    await expect(this.page.getByText(text).first()).toBeVisible();
  }

  async waitForTextToClear(text: string): Promise<void> {
    await expect(this.page.getByText(text)).toHaveCount(0);
  }

  async waitForRowContaining(text: string): Promise<void> {
    await expect(this.rows().filter({ hasText: text })).toHaveCount(1);
  }

  async expectControlEnabled(name: string): Promise<void> {
    await expect(this.button(name)).toBeEnabled();
  }

  /** "Listed together" — every row sits in one and the same list. */
  async expectRowsShareOneList(): Promise<void> {
    await expect(
      this.page.getByRole("list").filter({ has: this.page.getByRole("button", { name: PLAY_CONTROL }) }),
    ).toHaveCount(1);
  }

  // ── Stored bytes ─────────────────────────────────────────────
  /** Fetches what storage serves back for a record and compares it to what was uploaded. */
  async expectStoredBytes(recordName: string, byteLength: number): Promise<void> {
    const record = await this.recordNamed(recordName);
    if (!record.playUrl) {
      throw new Error(`The API returned "${recordName}" without a play url, so it cannot be played`);
    }

    const response = await this.api.get(record.playUrl);
    expect(response.status(), `stored audio for "${recordName}" could not be fetched`).toBe(200);
    expect((await response.body()).byteLength).toBe(byteLength);
  }

  // ── Accounts ─────────────────────────────────────────────────
  /**
   * Settles which account this test signs in with: the pre-provisioned one when
   * E2E_EMAIL/E2E_PASSWORD are set, otherwise a fresh confirmed account created here.
   */
  async provideAccount(preferredEmail: string): Promise<void> {
    if (PROVIDED_EMAIL && PROVIDED_PASSWORD) {
      this.account = { email: PROVIDED_EMAIL, password: PROVIDED_PASSWORD };
      return;
    }
    await this.createConfirmedAccount(preferredEmail);
  }

  /** Creates an already-confirmed account so specs never need a mailbox. */
  private async createConfirmedAccount(email: string): Promise<void> {
    const cognito = this.cognito();

    await cognito.send(
      new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        MessageAction: "SUPPRESS",
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "email_verified", Value: "true" },
        ],
      }),
    );
    await cognito.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        Password: ACCOUNT_PASSWORD,
        Permanent: true,
      }),
    );

    this.account = { email, password: ACCOUNT_PASSWORD };
    this.accounts.add(email);
  }

  async signInWithCredentials(): Promise<void> {
    if (!this.account) throw new Error("No account has been provided for this test");

    await this.fillInputByPlaceholder("Email", this.account.email);
    await this.fillInputByPlaceholder("Password", this.account.password);
    await this.clickButtonByName("Sign in");
  }

  // ── Teardown ─────────────────────────────────────────────────
  /** Idempotent: safe to call after a failure, and safe to call twice. */
  async cleanUp(): Promise<void> {
    await this.releaseRecords();
    await this.disableAccounts();
  }

  private async releaseRecords(): Promise<void> {
    if (!AUDIO_FILE_TABLE || this.created.size === 0) return;

    const documents = DynamoDBDocumentClient.from(new DynamoDBClient({ region: AWS_REGION }));
    const s3 = AUDIO_BUCKET ? new S3Client({ region: AWS_REGION }) : undefined;

    for (const id of this.created) {
      const storageKey = this.seen.get(id)?.storageKey;
      try {
        await documents.send(new DeleteCommand({ TableName: AUDIO_FILE_TABLE, Key: { id } }));
        if (s3 && storageKey) {
          await s3.send(new DeleteObjectCommand({ Bucket: AUDIO_BUCKET, Key: storageKey }));
        }
      } catch (error) {
        console.warn(`Could not release audio file ${id}:`, error);
      }
    }
  }

  /** Accounts are disabled rather than deleted, so no real account can be lost. */
  private async disableAccounts(): Promise<void> {
    if (!USER_POOL_ID) return;

    for (const email of this.accounts) {
      try {
        await this.cognito().send(
          new AdminDisableUserCommand({ UserPoolId: USER_POOL_ID, Username: email }),
        );
      } catch (error) {
        console.warn(`Could not disable ${email}:`, error);
      }
    }
    this.accounts.clear();
  }

  // ── Internals ────────────────────────────────────────────────
  private button(name: string): Locator {
    return this.page.getByRole("button", { name, exact: true });
  }

  private rows(): Locator {
    return this.page
      .getByRole("listitem")
      .filter({ has: this.page.getByRole("button", { name: PLAY_CONTROL }) });
  }

  /**
   * Records are learned from the app's own API traffic rather than by re-querying, so
   * the driver never needs a second set of credentials to read what the app can see.
   */
  private watchApiTraffic(): void {
    this.page.on("response", response => {
      if (!API_BASE_URL || !response.url().startsWith(API_BASE_URL) || !response.ok()) return;

      void response
        .json()
        .then((body: unknown) => {
          const isCreation =
            !!body && typeof body === "object" && "uploadUrl" in (body as Record<string, unknown>);

          for (const record of recordsIn(body)) {
            this.seen.set(record.id, { ...this.seen.get(record.id), ...record });
            if (isCreation) this.created.add(record.id);
          }
        })
        .catch(() => {
          /* preflight or non-JSON body — nothing to record */
        });
    });
  }

  private async recordNamed(name: string): Promise<ApiRecord> {
    const deadline = Date.now() + RECORD_WAIT_MS;

    while (Date.now() < deadline) {
      const match = [...this.seen.values()].find(record => record.name === name && record.playUrl);
      if (match) return match;
      await this.page.waitForTimeout(RECORD_POLL_MS);
    }

    throw new Error(`No API response carried a playable record named "${name}"`);
  }

  private cognito(): CognitoIdentityProviderClient {
    if (!USER_POOL_ID || !AWS_REGION) {
      throw new Error("No user pool in amplify_outputs.json — deploy a sandbox first");
    }
    this.cognitoClient ??= new CognitoIdentityProviderClient({ region: AWS_REGION });
    return this.cognitoClient;
  }
}
