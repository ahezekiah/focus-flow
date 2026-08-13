import { test as base } from "@playwright/test";
import { FocusFlowBrowserDriver } from "../focus-flow/focus-flow.browser.driver";
import { FocusFlowDsl } from "../focus-flow/focus-flow.dsl";
import { DslContext } from "../support/dsl-context";

/**
 * Construction and lifecycle only — no business logic. The driver cleans up after every
 * test whether it passed or failed; each test gets its own isolation context.
 */
export const test = base.extend<{
  driver: FocusFlowBrowserDriver;
  focusFlow: FocusFlowDsl;
}>({
  driver: [
    async ({ page, request }, use) => {
      const driver = new FocusFlowBrowserDriver(page, request);
      try {
        await use(driver);
      } finally {
        await driver.cleanUp();
      }
    },
    { auto: true },
  ],

  focusFlow: async ({ driver }, use) => {
    await use(new FocusFlowDsl(driver, new DslContext()));
  },
});
