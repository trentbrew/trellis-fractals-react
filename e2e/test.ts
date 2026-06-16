import { test as base, expect } from '@playwright/test';

/** Must be inlined — Playwright serializes init scripts without module closures. */
const WELCOME_DISMISSED_INIT = () => {
  localStorage.setItem('fractals-welcome-dismissed-v1', '1');
};

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(WELCOME_DISMISSED_INIT);
    await use(page);
  },
});

export { expect };
