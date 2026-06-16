import type { BrowserContext, Page } from '@playwright/test';

export const WELCOME_STORAGE_KEY = 'fractals-welcome-dismissed-v1';

export function welcomeDismissedInitScript(): void {
  localStorage.setItem(WELCOME_STORAGE_KEY, '1');
}

/** Skip the first-visit welcome dialog for fresh Playwright contexts. */
export async function primeWelcomeDismissed(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    localStorage.setItem('fractals-welcome-dismissed-v1', '1');
  });
}

export async function dismissWelcomeIfPresent(page: Page): Promise<void> {
  const gotIt = page.getByRole('button', { name: 'Got it' });
  if (await gotIt.isVisible({ timeout: 2000 }).catch(() => false)) {
    await gotIt.click();
  }
}
