#!/usr/bin/env node
/**
 * Smoke: kanban embed+readonly must not throw React hook errors.
 */
import { chromium } from '@playwright/test';

const base = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';
const url = `${base.replace(/\/$/, '')}/projections/kanban?embed=1&readonly=1`;

const pageErrors = [];
const consoleErrors = [];

const browser = await chromium.launch();
const page = await browser.newPage();

page.on('pageerror', (err) => pageErrors.push(err.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});

await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
await page.getByRole('heading', { name: 'Kanban' }).waitFor({ timeout: 15_000 });
await page.waitForTimeout(500);

const hookCrash = [...pageErrors, ...consoleErrors].some(
  (text) => text.includes('Minified React error #300') || text.includes('Rendered fewer hooks'),
);

await browser.close();

if (hookCrash) {
  console.error('FAIL: React hooks error on kanban embed readonly');
  console.error('pageErrors:', pageErrors);
  console.error('consoleErrors:', consoleErrors);
  process.exit(1);
}

console.log(`OK: ${url} loaded without React #300`);
