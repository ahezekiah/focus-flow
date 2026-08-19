import { defineConfig, devices } from "@playwright/test";
import { APP_BASE_URL } from "./support/api-config";

/**
 * Specs run against the app served by `npm run dev` at the repo root, talking to a
 * real deployed sandbox. Start both yourself — see e2e/README.md.
 *
 * One worker: every spec adds audio files to a shared sandbox, and the uploads are
 * slow enough that parallel workers buy little. Temporal isolation (support/dsl-context.ts)
 * already keeps the data from colliding if that ever changes.
 */

/**
 * Playwright's bundled Chromium needs the Visual C++ 2015–2022 x64 runtime, which not
 * every Windows machine has. Set `E2E_BROWSER_CHANNEL` to `chrome` or `msedge` to drive an
 * already-installed browser instead — no admin rights, same Chromium engine.
 */
const channel = process.env.E2E_BROWSER_CHANNEL;
export default defineConfig({
  testDir: "./specs",
  testMatch: /.*\.e2e\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: APP_BASE_URL,
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: channel ?? "chromium",
      use: { ...devices["Desktop Chrome"], ...(channel ? { channel } : {}) },
    },
  ],
});
