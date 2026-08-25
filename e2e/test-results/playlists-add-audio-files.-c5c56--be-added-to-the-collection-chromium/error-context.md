# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: playlists\add-audio-files.e2e.spec.ts >> Story-02: Add Audio Files >> An audio file that has been downloaded can be added to the collection
- Location: specs\playlists\add-audio-files.e2e.spec.ts:13:7

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: locator.click: Test timeout of 90000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Audio Files', exact: true })

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]: Rainy evening · quiet hours
  - heading "FocusFlow" [level=1] [ref=e7]
  - paragraph [ref=e8]: Find your rhythm. Protect your time.Do the work that matters.
  - button "Start Your First Session" [ref=e9]
  - button "Already have an account? Sign in" [ref=e12]
```

# Test source

```ts
  11  | import {
  12  |   API_BASE_URL,
  13  |   AUDIO_BUCKET,
  14  |   AUDIO_FILE_TABLE,
  15  |   AWS_REGION,
  16  |   PLAYLIST_TABLE,
  17  |   PROVIDED_EMAIL,
  18  |   PROVIDED_PASSWORD,
  19  |   USER_POOL_ID,
  20  | } from "../support/api-config";
  21  | import type { AudioPayload } from "../support/audio-asset";
  22  | 
  23  | /**
  24  |  * The only layer that knows about Playwright, selectors, the API protocol and AWS.
  25  |  * Method names describe mechanisms, never intent — intent belongs in the DSL.
  26  |  */
  27  | 
  28  | /** Which collection a record came from, so teardown knows where to release it. */
  29  | type RecordKind = "audio" | "playlist";
  30  | 
  31  | /** A record as the API returns it. Only the fields the driver needs to act on. */
  32  | interface ApiRecord {
  33  |   id: string;
  34  |   kind: RecordKind;
  35  |   name?: string;
  36  |   playUrl?: string;
  37  |   storageKey?: string;
  38  |   tracks?: { id: string; name: string }[];
  39  | }
  40  | 
  41  | /** Meets the pool's policy: 8+ characters with upper, lower, number and symbol. */
  42  | const ACCOUNT_PASSWORD = "E2e-Passw0rd!";
  43  | const RECORD_WAIT_MS = 15_000;
  44  | const RECORD_POLL_MS = 250;
  45  | const PLAYBACK_WAIT_MS = 20_000;
  46  | 
  47  | /** Rows on the audio list are the list items carrying a "Play <name>" control. */
  48  | const PLAY_CONTROL = /^Play .+/;
  49  | 
  50  | /** What the elapsed-time counter reads before any audio has been heard. */
  51  | const NOTHING_PLAYED_YET = "0:00";
  52  | 
  53  | function isRecord(candidate: unknown): boolean {
  54  |   return !!candidate && typeof (candidate as { id?: unknown }).id === "string";
  55  | }
  56  | 
  57  | function manyOrOne(many: unknown, one: unknown): unknown[] {
  58  |   if (Array.isArray(many)) return many;
  59  |   return one === undefined ? [] : [one];
  60  | }
  61  | 
  62  | function recordsIn(body: unknown): ApiRecord[] {
  63  |   if (!body || typeof body !== "object") return [];
  64  |   const payload = body as Record<string, unknown>;
  65  | 
  66  |   const groups: [RecordKind, unknown[]][] = [
  67  |     ["audio", manyOrOne(payload.audioFiles, payload.audioFile)],
  68  |     ["playlist", manyOrOne(payload.playlists, payload.playlist)],
  69  |   ];
  70  | 
  71  |   const wrapped = groups.flatMap(([kind, candidates]) =>
  72  |     candidates.filter(isRecord).map(candidate => ({ ...(candidate as ApiRecord), kind })),
  73  |   );
  74  |   if (wrapped.length > 0) return wrapped;
  75  | 
  76  |   // A bare record with no wrapper around it — how the audio-files update answers.
  77  |   return isRecord(payload) ? [{ ...(payload as unknown as ApiRecord), kind: "audio" }] : [];
  78  | }
  79  | 
  80  | function tableFor(kind: RecordKind): string {
  81  |   return kind === "playlist" ? PLAYLIST_TABLE : AUDIO_FILE_TABLE;
  82  | }
  83  | 
  84  | export class FocusFlowBrowserDriver {
  85  |   /** Every record the API has mentioned this test, keyed by id. */
  86  |   private readonly seen = new Map<string, ApiRecord>();
  87  |   /** Ids this test created, so teardown only ever touches its own data. */
  88  |   private readonly created = new Set<string>();
  89  |   /** Accounts created here, so teardown never touches a pre-provisioned one. */
  90  |   private readonly accounts = new Set<string>();
  91  |   private account?: { email: string; password: string };
  92  |   private cognitoClient?: CognitoIdentityProviderClient;
  93  | 
  94  |   constructor(
  95  |     private readonly page: Page,
  96  |     private readonly api: APIRequestContext,
  97  |   ) {
  98  |     this.watchApiTraffic();
  99  |   }
  100 | 
  101 |   // ── Navigation ───────────────────────────────────────────────
  102 |   async open(routePath: string): Promise<void> {
  103 |     await this.page.goto(routePath);
  104 |   }
  105 | 
  106 |   async reload(): Promise<void> {
  107 |     await this.page.reload();
  108 |   }
  109 | 
  110 |   async clickNavItem(label: string): Promise<void> {
> 111 |     await this.button(label).click();
      |                              ^ Error: locator.click: Test timeout of 90000ms exceeded.
  112 |   }
  113 | 
  114 |   // ── Forms and controls ───────────────────────────────────────
  115 |   async clickButtonByName(name: string): Promise<void> {
  116 |     await this.button(name).click();
  117 |   }
  118 | 
  119 |   /** For steps that must tolerate either starting screen. */
  120 |   async clickButtonIfPresent(name: string): Promise<void> {
  121 |     const control = this.button(name);
  122 |     if ((await control.count()) > 0) await control.click();
  123 |   }
  124 | 
  125 |   async fillInputByPlaceholder(placeholder: string, value: string): Promise<void> {
  126 |     await this.page.getByPlaceholder(placeholder, { exact: true }).fill(value);
  127 |   }
  128 | 
  129 |   async fillFieldByLabel(label: string, value: string): Promise<void> {
  130 |     await this.page.getByLabel(label, { exact: true }).fill(value);
  131 |   }
  132 | 
  133 |   /** For steps where the form may have been skipped past by a redirect. */
  134 |   async fillFieldIfPresent(label: string, value: string): Promise<void> {
  135 |     const field = this.page.getByLabel(label, { exact: true });
  136 |     if ((await field.count()) > 0) await field.fill(value);
  137 |   }
  138 | 
  139 |   async waitForHeading(name: string): Promise<void> {
  140 |     await expect(this.page.getByRole("heading", { name, exact: true })).toBeVisible();
  141 |   }
  142 | 
  143 |   async waitForLabelText(text: string): Promise<void> {
  144 |     await expect(this.page.getByText(text, { exact: true }).first()).toBeVisible();
  145 |   }
  146 | 
  147 |   async expectFieldValue(label: string, value: string): Promise<void> {
  148 |     await expect(this.page.getByLabel(label, { exact: true })).toHaveValue(value);
  149 |   }
  150 | 
  151 |   /** The field is flagged as needing attention, with its own message beside it. */
  152 |   async expectFieldQueried(label: string): Promise<void> {
  153 |     const field = this.page.getByLabel(label, { exact: true });
  154 | 
  155 |     await expect(field).toHaveAttribute("aria-invalid", "true");
  156 |     await expect(field.locator("xpath=..").getByRole("alert")).toBeVisible();
  157 |   }
  158 | 
  159 |   /** Something on screen is telling the user what still needs doing. */
  160 |   async expectPromptShowing(): Promise<void> {
  161 |     await expect(this.page.getByRole("alert").first()).toBeVisible();
  162 |   }
  163 | 
  164 |   /** The card under this heading carries an explanation of its own. */
  165 |   async expectExplanationUnderHeading(name: string): Promise<void> {
  166 |     const card = this.page
  167 |       .locator('[data-slot="card"]')
  168 |       .filter({ has: this.page.getByRole("heading", { name, exact: true }) });
  169 | 
  170 |     await expect(card.locator('[data-slot="card-description"]')).not.toBeEmpty();
  171 |   }
  172 | 
  173 |   // ── Choice groups ────────────────────────────────────────────
  174 |   async clickChoiceInGroup(groupName: string, name: string): Promise<void> {
  175 |     await this.choicesIn(groupName).getByRole("button", { name, exact: true }).click();
  176 |   }
  177 | 
  178 |   async expectChoiceInGroup(groupName: string, name: string): Promise<void> {
  179 |     await expect(this.choicesIn(groupName).getByRole("button", { name, exact: true })).toBeVisible();
  180 |   }
  181 | 
  182 |   async expectGroupOffersAtLeast(groupName: string, count: number): Promise<void> {
  183 |     await expect(this.choicesIn(groupName).getByRole("button").nth(count - 1)).toBeVisible();
  184 |   }
  185 | 
  186 |   /** The control carrying this text is the one currently chosen. */
  187 |   async expectControlChosen(text: string): Promise<void> {
  188 |     await expect(
  189 |       this.page.getByRole("button", { pressed: true }).filter({ hasText: text }),
  190 |     ).toHaveCount(1);
  191 |   }
  192 | 
  193 |   async checkBoxByName(name: string): Promise<void> {
  194 |     await this.page.getByRole("checkbox", { name, exact: true }).check();
  195 |   }
  196 | 
  197 |   /**
  198 |    * The picker is a hidden input. Scoped away from the multi-select uploader on the
  199 |    * music page so it stays unambiguous if both are ever mounted at once.
  200 |    */
  201 |   async chooseFile(payload: AudioPayload): Promise<void> {
  202 |     await this.page
  203 |       .locator('input[type="file"][accept="audio/*"]:not([multiple])')
  204 |       .setInputFiles({ name: payload.name, mimeType: payload.mimeType, buffer: payload.buffer });
  205 |   }
  206 | 
  207 |   // ── Waits and assertions on what is displayed ────────────────
  208 |   async waitForButton(name: string): Promise<void> {
  209 |     await expect(this.button(name)).toBeVisible();
  210 |   }
  211 | 
```