import { expect, test } from '@playwright/test';

const room = 'qa-presence-check';

test('kanban same-browser presence — two tabs see 2 online', async ({ browser }) => {
  const context = await browser.newContext();
  const pageA = await context.newPage();
  const pageB = await context.newPage();

  const url = `/projections/kanban?room=${room}`;
  await pageA.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
  await pageB.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
  await pageA.waitForTimeout(2500);

  const onlineA = pageA.getByText(/\d+ online/);
  const onlineB = pageB.getByText(/\d+ online/);
  await expect(onlineA).toBeVisible({ timeout: 15_000 });
  await expect(onlineB).toBeVisible({ timeout: 15_000 });

  const textA = await onlineA.textContent();
  const textB = await onlineB.textContent();
  expect(textA).toMatch(/2 online/);
  expect(textB).toMatch(/2 online/);

  await context.close();
});

test('kanban cross-browser presence — two contexts', async ({ browser }) => {
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();

  const url = `/projections/kanban?room=${room}-cross`;
  await pageA.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
  await pageB.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
  await pageA.waitForTimeout(3500);

  const onlineA = await pageA.getByText(/\d+ online/).textContent();
  const onlineB = await pageB.getByText(/\d+ online/).textContent();

  test.info().annotations.push({ type: 'onlineA', description: onlineA ?? '' });
  test.info().annotations.push({ type: 'onlineB', description: onlineB ?? '' });

  const twoOnline =
    /2 online/.test(onlineA ?? '') || /2 online/.test(onlineB ?? '');
  expect(twoOnline, `cross-browser presence: A="${onlineA}" B="${onlineB}"`).toBe(true);

  await ctxA.close();
  await ctxB.close();
});

test('blog embed gallery loads iframes', async ({ page }) => {
  await page.goto('/fractals/embeds', { waitUntil: 'networkidle', timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'Blog embed gallery' })).toBeVisible();
  const iframes = page.locator('iframe');
  await expect(iframes).toHaveCount(6, { timeout: 15_000 });

  await expect(page.getByTestId('embed-device-toggle')).toBeVisible();

  await page.getByRole('radio', { name: 'Mobile preview' }).click();
  const gridFrame = page.locator('#collection-grid [data-testid="embed-device-frame"]');
  await expect(gridFrame).toHaveAttribute('data-device-frame', 'mobile');
  const box = await gridFrame.boundingBox();
  expect(box?.width ?? 0).toBeLessThanOrEqual(420);

  const collectionIframe = page.frameLocator('#collection-grid iframe');
  await expect(collectionIframe.getByTestId('grid-board-projection')).toHaveAttribute(
    'data-board-projection',
    'grid',
    { timeout: 15_000 },
  );
  await expect(collectionIframe.getByTestId('grid-board-projection')).toHaveAttribute(
    'data-effective-cols',
    '1',
    { timeout: 15_000 },
  );
});
