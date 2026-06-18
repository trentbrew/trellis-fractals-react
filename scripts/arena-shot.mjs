import { chromium } from '@playwright/test';

const room = `shot-${Date.now().toString(36)}`;
const b = await chromium.launch();
const p = await (
  await b.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 })
).newPage();
await p.goto(`http://localhost:3000/arena?room=${room}`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);
const input = p.locator('input[placeholder="type a word…"]');
const type = async (w) => {
  await input.fill(w);
  await input.press('Enter');
  await p.waitForTimeout(300);
};
for (const w of ['boulder', 'meteor', 'phoenix', 'lantern', 'tide', 'spark', 'comet', 'ember']) {
  await type(w);
}
await p.waitForTimeout(1500);
await p.screenshot({ path: '/tmp/arena-drift.png' });

// command word: gravity → everything falls to the floor
await type('gravity');
await p.waitForTimeout(2200);
await p.screenshot({ path: '/tmp/arena-gravity.png' });

await b.close();
console.log('shots saved');
