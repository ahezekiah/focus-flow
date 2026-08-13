# Focus Flow — executable specifications

Browser specs that drive the real app against a real deployed sandbox. Conventions live in
[`.claude/prompt-snippets/e2e-conventions.md`](../.claude/prompt-snippets/e2e-conventions.md);
this file covers only how to run them.

## First time

```powershell
cd e2e
npm install
npx playwright install chromium
```

### If `playwright install` reports a missing `msvcp140_1.dll`

Playwright's bundled Chromium needs the **Visual C++ 2015–2022 x64 redistributable**, which
plenty of Windows machines don't have. Either fix works:

```powershell
# Either: drive an already-installed browser instead — no admin rights needed
$env:E2E_BROWSER_CHANNEL = "chrome"     # or "msedge"

# Or: install the runtime once (prompts for elevation), then use bundled Chromium
winget install --id Microsoft.VCRedist.2015+.x64
```

Leave `E2E_BROWSER_CHANNEL` unset in CI so runs stay on the pinned bundled Chromium.

## Running

Two things must be up before the specs will do anything:

```powershell
# 1. A deployed sandbox — writes amplify_outputs.json at the repo root. Leave it running.
npx ampx sandbox

# 2. The app
npm run dev
```

Plus an account to sign in with, either way round:

```powershell
# Either: an account that already exists and is confirmed — no AWS credentials needed
$env:E2E_EMAIL = "designer@example.com"; $env:E2E_PASSWORD = "…"

# Or: working AWS credentials (the same ones the sandbox deploys with, so `aws sso login`
# if the session has expired). Each test then creates its own confirmed account and
# disables it afterwards, and no mailbox is involved.
```

Then, from `e2e/`:

```powershell
cmd /c "node_modules\.bin\playwright.cmd test --config=playwright.config.ts --reporter=list > C:\Temp\test-out.txt 2>&1"
Get-Content C:\Temp\test-out.txt
```

The redirect must sit inside the `cmd /c` string — `npm run` re-spawns Playwright in a separate
console window on Windows and swallows it. Unit tests (`jest`) run the same way.

If no sandbox has been deployed, every browser spec **skips** with a reason instead of failing.

Overrides: `E2E_BASE_URL` (defaults to `http://localhost:5173`), `E2E_EMAIL` / `E2E_PASSWORD`,
`E2E_AUDIO_FILE_TABLE` (see below).

## What is covered

| Spec | Story |
|---|---|
| `specs/playlists/add-audio-files.e2e.spec.ts` | S-1.3.2 — [Add Audio Files](../docs/requirements/capabilities/cap-01-platform-foundation/functions/fn-01-platform-deployment/epics/ep-3-default-playlist/stories/story-02-add-audio-files.md) |

Each `test(...)` title is one acceptance criterion, and its body is that criterion's
Given/When/Then, in order.

## Teardown, and what it cannot reach yet

- **Accounts** created by a test are made confirmed through Cognito and **disabled** (never
  deleted) afterwards. An account supplied through `E2E_EMAIL` is left alone entirely.
- **Audio files have no delete endpoint**, so teardown cannot remove what a run adds through the
  product. Added audio stays in the sandbox; specs stay reliable because temporal isolation gives
  every run its own names, and assertions only ever look at the run's own rows.
- To get complete teardown in the meantime, set `E2E_AUDIO_FILE_TABLE` to the sandbox's audio
  file table name. Teardown then deletes the rows it created and their stored files directly.
  It is opt-in on purpose: naming the table is the developer's confirmation of which environment
  may be written to.
- A `DELETE /audio-files/{audioFileId}` endpoint would remove the need for that variable
  altogether, and would let cleanup go through the product like every other step.

## Notes

- `typescript` here is pinned to 5.x rather than the repo root's 6.x because `ts-jest` does not
  support TypeScript 6 yet. It affects only the Jest unit tests — Playwright transpiles specs
  itself.
- Specs run on one worker: every run uploads to the same sandbox bucket.
