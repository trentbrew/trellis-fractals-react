/** Throwaway: prove word→synced-entity round-trips across two clients. */
import { chromium } from '@playwright/test';

const base = process.env.BASE ?? 'http://localhost:3000';
const room = `verify-${Date.now().toString(36)}`;
const word = `glyph${Math.floor(Math.random() * 1e4)}`;
const url = `${base}/arena?room=${room}`;

const browser = await chromium.launch();
const a = await browser.newContext();
const b = await browser.newContext();
const pa = await a.newPage();
const pb = await b.newPage();

let ok = false;
try {
  await pa.goto(url, { waitUntil: 'networkidle' });
  await pb.goto(url, { waitUntil: 'networkidle' });

  // let identity + subscription settle on both clients
  await pa.waitForTimeout(1500);

  const input = pa.locator('input[placeholder="type a word…"]');
  await input.click();
  await input.fill(word);
  await input.press('Enter');

  // peer B must receive the spawn via the realtime subscription (no reload)
  await pb.getByText(word, { exact: true }).waitFor({ state: 'visible', timeout: 8000 });
  ok = true;
  console.log(`PASS — "${word}" spawned on A appeared on B in room #${room}`);
} catch (err) {
  console.error('FAIL —', err?.message ?? err);
} finally {
  await browser.close();
}
process.exit(ok ? 0 : 1);
