/** Prove remote cursors render across two clients via the presence relay. */
import { chromium } from '@playwright/test';

const room = `cur-${Date.now().toString(36)}`;
const url = `http://localhost:3000/arena?room=${room}`;
const b = await chromium.launch();
const pa = await (await b.newContext()).newPage();
const pb = await (await b.newContext()).newPage();

let ok = false;
try {
  await pa.goto(url, { waitUntil: 'networkidle' });
  await pb.goto(url, { waitUntil: 'networkidle' });
  await pa.waitForTimeout(1800); // relay join + presence settle

  // wiggle A's pointer so it broadcasts a cursor position
  for (let i = 0; i < 14; i++) {
    await pa.mouse.move(200 + i * 30, 250 + i * 12);
    await pa.waitForTimeout(60);
  }

  // B must render A's remote cursor (distinctive pointer svg path)
  await pb
    .locator('path[d^="M2 2 L2 16"]')
    .first()
    .waitFor({ state: 'visible', timeout: 8000 });
  ok = true;
  console.log(`PASS — remote cursor from A visible on B in room #${room}`);
} catch (err) {
  console.error('FAIL —', err?.message ?? err);
} finally {
  await b.close();
}
process.exit(ok ? 0 : 1);
