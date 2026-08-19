# Reference: E2E Test Conventions

End-to-end tests for Focus Flow drive the **real React SPA against a real deployed backend** through a browser. They are the only layer that can exercise routing, the auth token flow, server-returned errors, and uploaded audio playback end to end.

## Module location

E2E tests live in a **top-level `e2e/` module**, alongside `src/` and `amplify/`:

```
focus-flow/
├── src/
├── components/
├── amplify/
├── e2e/           ← all e2e code lives here
│   ├── package.json
│   ├── playwright.config.ts
│   ├── jest.config.ts
│   ├── specs/         (*.e2e.spec.ts files)
│   ├── focus-flow/    (DSL + driver)
│   ├── fixtures/
│   └── support/
└── ...
```

Unit tests stay next to the code they cover under `src/**/*.spec.ts`. Never mix unit tests and e2e tests in the same module.

## Tooling

- **Playwright** (`@playwright/test`) handles browser automation. Do not introduce Cypress, WebdriverIO, or Selenium.
- **Jest** is the test runner for non-browser tests within the `e2e/` module (e.g. DSL unit tests, driver contract tests). Use `@playwright/test` for browser-driven specs.
- The Playwright config (`e2e/playwright.config.ts`) governs e2e runs so it can be tuned independently of any future smoke suite.

## NPM scripts (run from `e2e/`)

```jsonc
{
  "test:e2e":        "playwright test --config=playwright.config.ts",
  "test:e2e:headed": "playwright test --config=playwright.config.ts --headed",
  "test:e2e:ui":     "playwright test --config=playwright.config.ts --ui",
  "test:e2e:report": "playwright show-report",
  "test:unit":       "jest"
}
```

### Running tests on Windows

On Windows, `npx` and `npm run` spawn child processes in a **separate console window** — the output is not visible in the calling PowerShell session. Run the playwright binary directly and redirect to a temp file:

```powershell
# All e2e tests
cd e2e
cmd /c "node_modules\.bin\playwright.cmd test --config=playwright.config.ts --reporter=list > C:\Temp\test-out.txt 2>&1"
Get-Content C:\Temp\test-out.txt

# Single spec
cmd /c "node_modules\.bin\playwright.cmd test --config=playwright.config.ts --reporter=list specs/playlists/add-audio-file.e2e.spec.ts > C:\Temp\test-out.txt 2>&1"
Get-Content C:\Temp\test-out.txt

# With grep filter
cmd /c "node_modules\.bin\playwright.cmd test --config=playwright.config.ts --grep ""S-1.3.2"" --reporter=list > C:\Temp\test-out.txt 2>&1"
Get-Content C:\Temp\test-out.txt

# Jest unit tests (DSL/driver contract tests)
cmd /c "node_modules\.bin\jest.cmd > C:\Temp\test-out.txt 2>&1"
Get-Content C:\Temp\test-out.txt
```

Rules:
- **Always use `node_modules\.bin\playwright.cmd`** directly — not `npm run test:e2e` or bare `npx playwright`. npm spawns a PowerShell child that re-spawns playwright in a new window, swallowing the redirect. The redirect must be **inside** the `cmd /c` string.
- **Always pass `--config=playwright.config.ts`** so `baseURL` is set; without it, all `page.goto('/...')` calls fail with "Cannot navigate to invalid URL".
- Exit code from `cmd /c` is reliable: 0 = all passed, non-zero = failures.
- Pass `--reporter=line` or `--reporter=list` for readable streaming output.

## Local prerequisites

There is no local API process — the backend is deployed. E2E always runs the frontend against a **real deployed sandbox**:

```powershell
# 1. Deploy a personal sandbox backend — leave this running, it watches for changes
npx ampx sandbox

# 2. Once it reports the first successful deploy, amplify_outputs.json is written at the repo root,
#    where both the Vite dev server and e2e/support/api-config.ts (the driver's API base URL) read it

# 3. Start the app
npm run dev
```

Then verify the app is up by **checking its port** — do NOT try to read process output on Windows (spawned processes write to a separate console window):

```powershell
(Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -EA SilentlyContinue).StatusCode  # expect 200
```

If the app is not up, start it and poll the port:

```powershell
# npm run dev spawns a separate window — just poll the port
Start-Process cmd -ArgumentList "/c", "cd /d C:\Users\Adjunct.JIMMYG2\Desktop\projects\focus-flow && npm run dev" -WindowStyle Minimized
$end = (Get-Date).AddSeconds(120)
while ((Get-Date) -lt $end) {
  if ((Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -EA SilentlyContinue).StatusCode -eq 200) { "App ready"; break }
  Start-Sleep 5
}
```

Rules:
- **Never wait on command output** to determine if a server is ready — on Windows, `npm run dev` writes to a separate console window.
- **Always poll the port** with `Invoke-WebRequest` until you get a 200.
- Each test must create the data it needs. Do **not** depend on pre-seeded data beyond the public reference data (themes, default playlists).

---

## Spec → DSL → Driver → Playwright (four layers)

Keep e2e code split into four layers, each with one job. Mixing them — calling Playwright APIs from a spec, or putting business vocabulary in the driver — is the most common review-rejection pattern.

```
spec —uses—> DSL (FocusFlowDsl, FocusFlowDslAssert) —uses—> Driver (FocusFlowBrowserDriver) —uses—> Playwright (page, request, expect)
                    ↑
              Fixtures (e2e/fixtures/) wire it all together
```

### Layer 1 — Spec files (`e2e/specs/**/*.e2e.spec.ts`)

- Express **business scenarios** in Given/When/Then form, mirroring the `## Given / When / Then` block in the corresponding story under `docs/requirements/capabilities/**/stories/`.
- OK: `await focusFlow.signUp('email: alice@example.com')`, `await focusFlow.addAudioFile('name: Rainfall')`, `await confirmThat(focusFlow).playlistTrackCount('count: 1')`.
- OK: `test.skip(...)` and using fixtures from `./fixtures`.
- **Not OK**: importing from `playwright`, `@playwright/test` (beyond what fixtures re-export), or any `*.driver.ts`. Don't touch `page`, selectors, cookies, `localStorage`, timeouts, or env vars here.
- **Not OK**: bare `expect(...)` on raw values. Always go through `confirmThat(focusFlow).<assertion>(...)`.
- One spec file per story (or per epic when stories share scenes). Name it after the story slug.

### Layer 2 — DSL (`e2e/focus-flow/focus-flow.dsl.ts`, `e2e/focus-flow/focus-flow.dsl-assert.ts`)

- A **domain vocabulary** for Focus Flow concepts: focus sessions, playlists, audio files, themes, accountability partners, streaks. Methods read like English (`signUp`, `addAudioFile`, `startFocusSession`, `chooseTheme`, `invitePartner`).
- The DSL is the **only** layer specs talk to.
- Use the typed-tag string format `'<name: value>'` (e.g. `'name: Rainfall'`, `'duration: 25 minutes'`) and parse it via a shared `parseParam` helper. Keep this convention so specs stay readable.
- Action verbs live on `FocusFlowDsl`. Assertions live on `FocusFlowDslAssert` and are reached through `confirmThat(focusFlow).<...>`. Don't put `expect(...)` on `FocusFlowDsl`.
- The DSL **delegates to the driver** for anything that touches the browser or HTTP: `this.driver.fillSignUpForm(...)`, `this.driver.clickAddAudioFile()`, `this.driver.readRowCount()`. It must not call Playwright directly.
- **Not OK**: importing `playwright`, `@playwright/test`, `fs`, `path`, `child_process`, or referencing selectors, cookies, `localStorage`, or timeouts.
- When adding a new scenario verb, add it to the DSL first (a `console.log` stub is fine), then back it with a driver method.

### Layer 3 — Driver (`e2e/focus-flow/focus-flow.browser.driver.ts`)

- The **only** place that knows about Playwright (`Page`, `Locator`, `APIRequestContext`), CSS/role selectors, the auth token dance, file-upload paths, and data cleanup through the API.
- Owns: navigating to routes, locating elements by accessible role/name (prefer `getByRole`/`getByLabel` over CSS), filling forms, uploading audio files, reading network responses, and seeding/cleaning data through the API.
- OK: anything Playwright/HTTP/file-system related, retries/polling, `expect(locator).toBeVisible()`.
- **Not OK**: business vocabulary (`focus session`, `streak`, `playlist`) leaking into method names — driver methods describe *mechanisms* (`clickPrimaryButton`, `getRowsInTable('audio-files')`), not *intent*. Intent belongs in the DSL.
- **Not OK**: throwing bare strings; use a `requirePage()` / `requireSignedInUser()` pattern so misuse fails with a clear message.
- Cleanup is mandatory and must remain idempotent — every test artifact (data record, uploaded file, signed-in session) must be released in fixture teardown. **Deactivate** user accounts rather than deleting them.

### Layer 4 — Fixtures (`e2e/fixtures/`)

- Wire the layers together for Playwright. `focus-flow.ts` extends `@playwright/test` with test-scoped fixtures: `driver` (constructs the driver, calls cleanup after each test, `auto: true`), `focusFlow` (wraps the driver in `FocusFlowDsl`).
- Specs import `test` and any skip helpers from `./fixtures` — **never** from `@playwright/test` directly — so the layering and any availability skips stay consistent.
- Don't add business logic here. Fixtures only do construction, lifecycle, and re-exports.

---

## Temporal isolation

When multiple test runs execute against the same data store (sequential runs, parallel workers, or a shared sandbox), human-readable names can collide. Two test runs both creating an audio file named "Rainfall" may find each other's rows and produce false positives or flaky failures.

**Temporal isolation** solves this by having the DSL silently append a short, run-unique suffix to any value that is used as a discriminator in the UI.

### How it works

`DslContext` (in `e2e/support/dsl-context.ts`) holds a SHA-256 hash derived from a per-test seed (default: `Date.now()`). Its `alias(value)` method builds a stable alias for any plain value:

```
alias("Rainfall") →  "Rainfall1a3f2"    (within a test run seeded at 1693847201234)
alias("Rainfall") →  "Rainfall1a3f2"    (same call → same result, always cached)
alias("Ocean")    →  "Ocean1a3f2"       (different value, same hash suffix)

# A different test run (different seed) produces:
alias("Rainfall") →  "Rainfall1b9c4"
```

The algorithm:
1. `shortHash(seed)` = first 4 hex characters of SHA-256(seed)
2. `alias(value)` = `value` + global sequence number (starts at 1 per unique value) + hash
3. Aliases are cached — calling `alias("Rainfall")` twice returns the exact same string

### Wiring (fixture creates one context per test)

```ts
// e2e/fixtures/focus-flow.ts
focusFlow: async ({ driver }, use) => {
  const ctx = new DslContext();          // unique seed per test
  await use(new FocusFlowDsl(driver, ctx));
},
```

### DSL usage — alias at the boundary

Call `ctx.alias()` in the DSL when the value will be written to the system **and** later searched for in assertions. The spec always writes the plain name; isolation is invisible above the DSL.

```ts
// e2e/focus-flow/focus-flow.dsl.ts — action verb
async addsAudioFile(nameParam: string): Promise<void> {
  const name = this.ctx.alias(parseParam(nameParam, 'name')); // "Rainfall" → "Rainfall1a3f2"
  await this.driver.fillInputByLabel(/Name/i, name);
  await this.driver.clickButtonByName(/Add/i);
}

// e2e/focus-flow/focus-flow.dsl-assert.ts — assertion verb
async showsAudioFileInList(nameParam: string): Promise<void> {
  const name = this.dsl.ctx.alias(parseParam(nameParam, 'name')); // same "Rainfall" → same alias
  await this.dsl.driver.waitForRowContaining(new RegExp(name));
}
```

The spec remains plain and readable:

```ts
// spec file — no alias knowledge
await focusFlow.addsAudioFile('name: Rainfall');
await confirmThat(focusFlow).showsAudioFileInList('name: Rainfall');
```

### When to alias vs when not to

| Use `ctx.alias()` | Use raw `parseParam()` |
|---|---|
| Display names (audio files, playlists, themes) | Enum values (`status: ready`) |
| Usernames, handles | Counts (`count: 3`) |
| Any field searched by text | IDs looked up by another mechanism |
| Data that must survive across setup + assertion | Emails managed by explicit cleanup |

### String interpolation

When one param value references another aliased value by name, use `ctx.interpolate()`:

```ts
// param: "playlist: Deep Work ${Rainfall}"
const playlist = this.ctx.interpolate(parseParam(playlistParam, 'playlist'));
// → "Deep Work Rainfall1a3f2"  (Rainfall must have been aliased already in this context)
```

### Temporal isolation rules

- **Only the DSL calls `ctx.alias()`** — never the spec, never the driver. The spec is always isolated from the alias mechanism.
- **Assertions mirror their corresponding setup verbs** — if `addsAudioFile('name: Rainfall')` aliases `Rainfall`, then `showsAudioFileInList('name: Rainfall')` must alias `Rainfall` with the same context.
- `DslContext` is created once per test (in the fixture). Never share a context across tests.
- Do not alias values that are not discriminators in the UI (statuses, counts, booleans).
- Each spec **creates its own data** through the API or UI, and **releases it** in teardown (fixture `finally` block). Never delete user accounts — mark them as `deactivated` instead, so real accounts are never accidentally removed.
- **Cleanup belongs at the end** — put teardown in the fixture `finally` block. Do not add `beforeEach` or `afterEach` cleanup blocks in spec files; with temporal isolation (aliased names/emails), there are no pre-test leftovers to clean up, and the fixture `finally` runs unconditionally after each test.
- **Always alias user names and emails** — use `ctx.alias(name)` for names and `aliasEmail(email)` (alias the local part before `@`) for emails in every DSL method that creates or references a user. This ensures each test run produces unique, non-conflicting accounts and deactivation-based teardown never causes 409 conflicts on subsequent runs.
- Do not share users across specs. All DSL methods that create users alias their inputs automatically — specs always write plain names/emails.
- Reference data that is intentionally shared (themes, default playlists) is **never** aliased and **never** deleted in teardown.

---

## Selectors

- Prefer `getByRole`, `getByLabel`, `getByText` — these reflect the user's view and survive Tailwind class churn.
- Add `data-testid` attributes only when accessible queries are genuinely insufficient (e.g. an icon-only button with no label). Set the attribute in the component, then key off it in the driver.
- Never select by Tailwind utility classes (`.bg-indigo-600`) — they are layout, not contract.

## Definition of done for an e2e change

- `npm run lint` and `npm run build` (repo root) pass.
- `npm run test:e2e` (from `e2e/`) passes locally with the sandbox deployed and the app running.
- `npm run test:unit` (from `e2e/`) passes for any Jest tests added or modified.
- Any new DSL verb has a matching driver method and at least one spec exercising it.
- No spec imports Playwright directly. No driver method names mention domain concepts. No DSL method touches selectors or the network.
