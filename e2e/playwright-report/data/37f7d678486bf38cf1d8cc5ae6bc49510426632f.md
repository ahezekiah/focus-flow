# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: playlists\designer-creates-a-playlist.e2e.spec.ts >> Story-01: Designer Creates a Playlist >> A playlist is available to play
- Location: specs\playlists\designer-creates-a-playlist.e2e.spec.ts:59:7

# Error details

```
CredentialsProviderError: Token is expired. To refresh this SSO session run 'aws sso login' with the corresponding profile.
```

# Test source

```ts
  159 | 
  160 |   async expectControlEnabled(name: string): Promise<void> {
  161 |     await expect(this.button(name)).toBeEnabled();
  162 |   }
  163 | 
  164 |   /** "Listed together" — every row sits in one and the same list. */
  165 |   async expectRowsShareOneList(): Promise<void> {
  166 |     await expect(
  167 |       this.page.getByRole("list").filter({ has: this.page.getByRole("button", { name: PLAY_CONTROL }) }),
  168 |     ).toHaveCount(1);
  169 |   }
  170 | 
  171 |   // ── Named lists and panels ───────────────────────────────────
  172 |   async waitForItemInList(listName: string, text: string): Promise<void> {
  173 |     await expect(this.itemsIn(listName).filter({ hasText: text })).toHaveCount(1);
  174 |   }
  175 | 
  176 |   async expectItemMissingFromList(listName: string, text: string): Promise<void> {
  177 |     await expect(this.itemsIn(listName).filter({ hasText: text })).toHaveCount(0);
  178 |   }
  179 | 
  180 |   /** One row, found by one piece of its text, showing another. */
  181 |   async waitForItemInListShowing(listName: string, itemText: string, text: string): Promise<void> {
  182 |     await expect(
  183 |       this.itemsIn(listName).filter({ hasText: itemText }).filter({ hasText: text }),
  184 |     ).toHaveCount(1);
  185 |   }
  186 | 
  187 |   /** The list holds exactly these entries, in this order. */
  188 |   async expectListItemsInOrder(listName: string, texts: string[]): Promise<void> {
  189 |     const items = this.itemsIn(listName);
  190 |     await expect(items).toHaveCount(texts.length);
  191 | 
  192 |     for (const [index, text] of texts.entries()) {
  193 |       await expect(items.nth(index)).toContainText(text);
  194 |     }
  195 |   }
  196 | 
  197 |   async waitForTextInPanel(panelName: string, text: string): Promise<void> {
  198 |     await expect(this.panel(panelName).getByText(text, { exact: true }).first()).toBeVisible();
  199 |   }
  200 | 
  201 |   async waitForButtonInPanel(panelName: string, buttonName: string): Promise<void> {
  202 |     await expect(this.panel(panelName).getByRole("button", { name: buttonName, exact: true })).toBeVisible();
  203 |   }
  204 | 
  205 |   // ── Audio actually running ───────────────────────────────────
  206 |   /** The elapsed counter moving off zero is the browser reporting real playback. */
  207 |   async expectPlaybackToProgress(): Promise<void> {
  208 |     await expect(this.page.getByRole("timer", { name: "Elapsed time" })).not.toHaveText(
  209 |       NOTHING_PLAYED_YET,
  210 |       { timeout: PLAYBACK_WAIT_MS },
  211 |     );
  212 |   }
  213 | 
  214 |   // ── What the system itself holds ─────────────────────────────
  215 |   /** Fetches what storage serves back for a record and compares it to what was uploaded. */
  216 |   async expectStoredBytes(recordName: string, byteLength: number): Promise<void> {
  217 |     const record = await this.recordNamed(recordName, candidate => !!candidate.playUrl);
  218 |     if (!record.playUrl) {
  219 |       throw new Error(`The API returned "${recordName}" without a play url, so it cannot be played`);
  220 |     }
  221 | 
  222 |     const response = await this.api.get(record.playUrl);
  223 |     expect(response.status(), `stored audio for "${recordName}" could not be fetched`).toBe(200);
  224 |     expect((await response.body()).byteLength).toBe(byteLength);
  225 |   }
  226 | 
  227 |   /** The API has answered with a playlist under this name, so the system holds it. */
  228 |   async expectStoredPlaylistNamed(recordName: string): Promise<void> {
  229 |     await this.playlistNamed(recordName);
  230 |   }
  231 | 
  232 |   /** The playlist the API answers with holds exactly these tracks, in this order. */
  233 |   async expectStoredPlaylistTracks(recordName: string, trackNames: string[]): Promise<void> {
  234 |     const record = await this.playlistNamed(recordName);
  235 | 
  236 |     expect(
  237 |       (record.tracks ?? []).map(track => track.name),
  238 |       `tracks the system holds for "${recordName}"`,
  239 |     ).toEqual(trackNames);
  240 |   }
  241 | 
  242 |   // ── Accounts ─────────────────────────────────────────────────
  243 |   /**
  244 |    * Settles which account this test signs in with: the pre-provisioned one when
  245 |    * E2E_EMAIL/E2E_PASSWORD are set, otherwise a fresh confirmed account created here.
  246 |    */
  247 |   async provideAccount(preferredEmail: string): Promise<void> {
  248 |     if (PROVIDED_EMAIL && PROVIDED_PASSWORD) {
  249 |       this.account = { email: PROVIDED_EMAIL, password: PROVIDED_PASSWORD };
  250 |       return;
  251 |     }
  252 |     await this.createConfirmedAccount(preferredEmail);
  253 |   }
  254 | 
  255 |   /** Creates an already-confirmed account so specs never need a mailbox. */
  256 |   private async createConfirmedAccount(email: string): Promise<void> {
  257 |     const cognito = this.cognito();
  258 | 
> 259 |     await cognito.send(
      |     ^ CredentialsProviderError: Token is expired. To refresh this SSO session run 'aws sso login' with the corresponding profile.
  260 |       new AdminCreateUserCommand({
  261 |         UserPoolId: USER_POOL_ID,
  262 |         Username: email,
  263 |         MessageAction: "SUPPRESS",
  264 |         UserAttributes: [
  265 |           { Name: "email", Value: email },
  266 |           { Name: "email_verified", Value: "true" },
  267 |         ],
  268 |       }),
  269 |     );
  270 |     await cognito.send(
  271 |       new AdminSetUserPasswordCommand({
  272 |         UserPoolId: USER_POOL_ID,
  273 |         Username: email,
  274 |         Password: ACCOUNT_PASSWORD,
  275 |         Permanent: true,
  276 |       }),
  277 |     );
  278 | 
  279 |     this.account = { email, password: ACCOUNT_PASSWORD };
  280 |     this.accounts.add(email);
  281 |   }
  282 | 
  283 |   async signInWithCredentials(): Promise<void> {
  284 |     if (!this.account) throw new Error("No account has been provided for this test");
  285 | 
  286 |     await this.fillInputByPlaceholder("Email", this.account.email);
  287 |     await this.fillInputByPlaceholder("Password", this.account.password);
  288 |     await this.clickButtonByName("Sign in");
  289 |   }
  290 | 
  291 |   // ── Teardown ─────────────────────────────────────────────────
  292 |   /** Idempotent: safe to call after a failure, and safe to call twice. */
  293 |   async cleanUp(): Promise<void> {
  294 |     await this.releaseRecords();
  295 |     await this.disableAccounts();
  296 |   }
  297 | 
  298 |   private async releaseRecords(): Promise<void> {
  299 |     if ((!AUDIO_FILE_TABLE && !PLAYLIST_TABLE) || this.created.size === 0) return;
  300 | 
  301 |     const documents = DynamoDBDocumentClient.from(new DynamoDBClient({ region: AWS_REGION }));
  302 |     const s3 = AUDIO_BUCKET ? new S3Client({ region: AWS_REGION }) : undefined;
  303 | 
  304 |     for (const id of this.created) {
  305 |       const record = this.seen.get(id);
  306 |       const table = tableFor(record?.kind ?? "audio");
  307 |       if (!table) continue;
  308 | 
  309 |       try {
  310 |         await documents.send(new DeleteCommand({ TableName: table, Key: { id } }));
  311 |         if (s3 && record?.storageKey) {
  312 |           await s3.send(new DeleteObjectCommand({ Bucket: AUDIO_BUCKET, Key: record.storageKey }));
  313 |         }
  314 |       } catch (error) {
  315 |         console.warn(`Could not release ${record?.kind ?? "audio"} record ${id}:`, error);
  316 |       }
  317 |     }
  318 |   }
  319 | 
  320 |   /** Accounts are disabled rather than deleted, so no real account can be lost. */
  321 |   private async disableAccounts(): Promise<void> {
  322 |     if (!USER_POOL_ID) return;
  323 | 
  324 |     for (const email of this.accounts) {
  325 |       try {
  326 |         await this.cognito().send(
  327 |           new AdminDisableUserCommand({ UserPoolId: USER_POOL_ID, Username: email }),
  328 |         );
  329 |       } catch (error) {
  330 |         console.warn(`Could not disable ${email}:`, error);
  331 |       }
  332 |     }
  333 |     this.accounts.clear();
  334 |   }
  335 | 
  336 |   // ── Internals ────────────────────────────────────────────────
  337 |   private button(name: string): Locator {
  338 |     return this.page.getByRole("button", { name, exact: true });
  339 |   }
  340 | 
  341 |   private rows(): Locator {
  342 |     return this.page
  343 |       .getByRole("listitem")
  344 |       .filter({ has: this.page.getByRole("button", { name: PLAY_CONTROL }) });
  345 |   }
  346 | 
  347 |   private itemsIn(listName: string): Locator {
  348 |     return this.page.getByRole("list", { name: listName, exact: true }).getByRole("listitem");
  349 |   }
  350 | 
  351 |   private panel(panelName: string): Locator {
  352 |     return this.page.getByRole("region", { name: panelName, exact: true });
  353 |   }
  354 | 
  355 |   /**
  356 |    * Records are learned from the app's own API traffic rather than by re-querying, so
  357 |    * the driver never needs a second set of credentials to read what the app can see.
  358 |    */
  359 |   private watchApiTraffic(): void {
```