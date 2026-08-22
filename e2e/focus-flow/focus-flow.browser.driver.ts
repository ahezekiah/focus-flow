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
  PLAYLIST_TABLE,
  PROVIDED_EMAIL,
  PROVIDED_PASSWORD,
  USER_POOL_ID,
} from "../support/api-config";
import type { AudioPayload } from "../support/audio-asset";

/**
 * The only layer that knows about Playwright, selectors, the API protocol and AWS.
 * Method names describe mechanisms, never intent — intent belongs in the DSL.
 */

/** Which collection a record came from, so teardown knows where to release it. */
type RecordKind = "audio" | "playlist";

/** A record as the API returns it. Only the fields the driver needs to act on. */
interface ApiRecord {
  id: string;
  kind: RecordKind;
  name?: string;
  playUrl?: string;
  storageKey?: string;
  tracks?: { id: string; name: string }[];
}

/** Meets the pool's policy: 8+ characters with upper, lower, number and symbol. */
const ACCOUNT_PASSWORD = "E2e-Passw0rd!";
const RECORD_WAIT_MS = 15_000;
const RECORD_POLL_MS = 250;
const PLAYBACK_WAIT_MS = 20_000;

/** Rows on the audio list are the list items carrying a "Play <name>" control. */
const PLAY_CONTROL = /^Play .+/;

/** What the elapsed-time counter reads before any audio has been heard. */
const NOTHING_PLAYED_YET = "0:00";

function isRecord(candidate: unknown): boolean {
  return !!candidate && typeof (candidate as { id?: unknown }).id === "string";
}

function manyOrOne(many: unknown, one: unknown): unknown[] {
  if (Array.isArray(many)) return many;
  return one === undefined ? [] : [one];
}

function recordsIn(body: unknown): ApiRecord[] {
  if (!body || typeof body !== "object") return [];
  const payload = body as Record<string, unknown>;

  const groups: [RecordKind, unknown[]][] = [
    ["audio", manyOrOne(payload.audioFiles, payload.audioFile)],
    ["playlist", manyOrOne(payload.playlists, payload.playlist)],
  ];

  const wrapped = groups.flatMap(([kind, candidates]) =>
    candidates.filter(isRecord).map(candidate => ({ ...(candidate as ApiRecord), kind })),
  );
  if (wrapped.length > 0) return wrapped;

  // A bare record with no wrapper around it — how the audio-files update answers.
  return isRecord(payload) ? [{ ...(payload as unknown as ApiRecord), kind: "audio" }] : [];
}

function tableFor(kind: RecordKind): string {
  return kind === "playlist" ? PLAYLIST_TABLE : AUDIO_FILE_TABLE;
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

  async fillFieldByLabel(label: string, value: string): Promise<void> {
    await this.page.getByLabel(label, { exact: true }).fill(value);
  }

  /** For steps where the form may have been skipped past by a redirect. */
  async fillFieldIfPresent(label: string, value: string): Promise<void> {
    const field = this.page.getByLabel(label, { exact: true });
    if ((await field.count()) > 0) await field.fill(value);
  }

  async waitForHeading(name: string): Promise<void> {
    await expect(this.page.getByRole("heading", { name, exact: true })).toBeVisible();
  }

  async waitForLabelText(text: string): Promise<void> {
    await expect(this.page.getByText(text, { exact: true }).first()).toBeVisible();
  }

  async expectFieldValue(label: string, value: string): Promise<void> {
    await expect(this.page.getByLabel(label, { exact: true })).toHaveValue(value);
  }

  /** The field is flagged as needing attention, with its own message beside it. */
  async expectFieldQueried(label: string): Promise<void> {
    const field = this.page.getByLabel(label, { exact: true });

    await expect(field).toHaveAttribute("aria-invalid", "true");
    await expect(field.locator("xpath=..").getByRole("alert")).toBeVisible();
  }

  /** Something on screen is telling the user what still needs doing. */
  async expectPromptShowing(): Promise<void> {
    await expect(this.page.getByRole("alert").first()).toBeVisible();
  }

  /** The card under this heading carries an explanation of its own. */
  async expectExplanationUnderHeading(name: string): Promise<void> {
    const card = this.page
      .locator('[data-slot="card"]')
      .filter({ has: this.page.getByRole("heading", { name, exact: true }) });

    await expect(card.locator('[data-slot="card-description"]')).not.toBeEmpty();
  }

  // ── Choice groups ────────────────────────────────────────────
  async clickChoiceInGroup(groupName: string, name: string): Promise<void> {
    await this.choicesIn(groupName).getByRole("button", { name, exact: true }).click();
  }

  async expectChoiceInGroup(groupName: string, name: string): Promise<void> {
    await expect(this.choicesIn(groupName).getByRole("button", { name, exact: true })).toBeVisible();
  }

  async expectGroupOffersAtLeast(groupName: string, count: number): Promise<void> {
    await expect(this.choicesIn(groupName).getByRole("button").nth(count - 1)).toBeVisible();
  }

  /** The control carrying this text is the one currently chosen. */
  async expectControlChosen(text: string): Promise<void> {
    await expect(
      this.page.getByRole("button", { pressed: true }).filter({ hasText: text }),
    ).toHaveCount(1);
  }

  async checkBoxByName(name: string): Promise<void> {
    await this.page.getByRole("checkbox", { name, exact: true }).check();
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

  // ── Named lists and panels ───────────────────────────────────
  async waitForItemInList(listName: string, text: string): Promise<void> {
    await expect(this.itemsIn(listName).filter({ hasText: text })).toHaveCount(1);
  }

  async expectItemMissingFromList(listName: string, text: string): Promise<void> {
    await expect(this.itemsIn(listName).filter({ hasText: text })).toHaveCount(0);
  }

  /** One row, found by one piece of its text, showing another. */
  async waitForItemInListShowing(listName: string, itemText: string, text: string): Promise<void> {
    await expect(
      this.itemsIn(listName).filter({ hasText: itemText }).filter({ hasText: text }),
    ).toHaveCount(1);
  }

  /** The list holds exactly these entries, in this order. */
  async expectListItemsInOrder(listName: string, texts: string[]): Promise<void> {
    const items = this.itemsIn(listName);
    await expect(items).toHaveCount(texts.length);

    for (const [index, text] of texts.entries()) {
      await expect(items.nth(index)).toContainText(text);
    }
  }

  async waitForTextInPanel(panelName: string, text: string): Promise<void> {
    await expect(this.panel(panelName).getByText(text, { exact: true }).first()).toBeVisible();
  }

  async waitForButtonInPanel(panelName: string, buttonName: string): Promise<void> {
    await expect(this.panel(panelName).getByRole("button", { name: buttonName, exact: true })).toBeVisible();
  }

  // ── Audio actually running ───────────────────────────────────
  /** The elapsed counter moving off zero is the browser reporting real playback. */
  async expectPlaybackToProgress(): Promise<void> {
    await expect(this.page.getByRole("timer", { name: "Elapsed time" })).not.toHaveText(
      NOTHING_PLAYED_YET,
      { timeout: PLAYBACK_WAIT_MS },
    );
  }

  // ── What the system itself holds ─────────────────────────────
  /** Fetches what storage serves back for a record and compares it to what was uploaded. */
  async expectStoredBytes(recordName: string, byteLength: number): Promise<void> {
    const record = await this.recordNamed(recordName, candidate => !!candidate.playUrl);
    if (!record.playUrl) {
      throw new Error(`The API returned "${recordName}" without a play url, so it cannot be played`);
    }

    const response = await this.api.get(record.playUrl);
    expect(response.status(), `stored audio for "${recordName}" could not be fetched`).toBe(200);
    expect((await response.body()).byteLength).toBe(byteLength);
  }

  /** The API has answered with a playlist under this name, so the system holds it. */
  async expectStoredPlaylistNamed(recordName: string): Promise<void> {
    await this.playlistNamed(recordName);
  }

  /** The playlist the API answers with holds exactly these tracks, in this order. */
  async expectStoredPlaylistTracks(recordName: string, trackNames: string[]): Promise<void> {
    const record = await this.playlistNamed(recordName);

    expect(
      (record.tracks ?? []).map(track => track.name),
      `tracks the system holds for "${recordName}"`,
    ).toEqual(trackNames);
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
    if ((!AUDIO_FILE_TABLE && !PLAYLIST_TABLE) || this.created.size === 0) return;

    const documents = DynamoDBDocumentClient.from(new DynamoDBClient({ region: AWS_REGION }));
    const s3 = AUDIO_BUCKET ? new S3Client({ region: AWS_REGION }) : undefined;

    for (const id of this.created) {
      const record = this.seen.get(id);
      const table = tableFor(record?.kind ?? "audio");
      if (!table) continue;

      try {
        await documents.send(new DeleteCommand({ TableName: table, Key: { id } }));
        if (s3 && record?.storageKey) {
          await s3.send(new DeleteObjectCommand({ Bucket: AUDIO_BUCKET, Key: record.storageKey }));
        }
      } catch (error) {
        console.warn(`Could not release ${record?.kind ?? "audio"} record ${id}:`, error);
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

  private choicesIn(groupName: string): Locator {
    return this.page.getByRole("group", { name: groupName, exact: true });
  }

  private itemsIn(listName: string): Locator {
    return this.page.getByRole("list", { name: listName, exact: true }).getByRole("listitem");
  }

  private panel(panelName: string): Locator {
    return this.page.getByRole("region", { name: panelName, exact: true });
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
          // 201 is the API's answer to every "this has just been created".
          const isCreation = response.status() === 201;

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

  private async recordNamed(
    name: string,
    isUsable: (record: ApiRecord) => boolean,
  ): Promise<ApiRecord> {
    const deadline = Date.now() + RECORD_WAIT_MS;

    while (Date.now() < deadline) {
      const match = [...this.seen.values()].find(
        record => record.name === name && isUsable(record),
      );
      if (match) return match;
      await this.page.waitForTimeout(RECORD_POLL_MS);
    }

    throw new Error(`No API response carried a usable record named "${name}"`);
  }

  private playlistNamed(name: string): Promise<ApiRecord> {
    return this.recordNamed(name, record => record.kind === "playlist");
  }

  private cognito(): CognitoIdentityProviderClient {
    if (!USER_POOL_ID || !AWS_REGION) {
      throw new Error("No user pool in amplify_outputs.json — deploy a sandbox first");
    }
    this.cognitoClient ??= new CognitoIdentityProviderClient({ region: AWS_REGION });
    return this.cognitoClient;
  }
}
