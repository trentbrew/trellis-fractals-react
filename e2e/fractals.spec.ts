import { expect, test } from './test';

async function setVantage(page: import('@playwright/test').Page, value: number) {
  const slider = page.getByTestId('vantage-control').locator('input[type="range"]');
  await slider.evaluate((input, nextValue) => {
    const range = input as HTMLInputElement;
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )?.set;
    valueSetter?.call(range, String(nextValue));
    range.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

test('fractals rail exposes entity and collection demos', async ({ page }) => {
  await page.goto('/fractals');

  await expect(page.getByRole('link', { name: 'Entity', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Entity', exact: true }).click();
  await expect(page).toHaveURL(/\/fractals\/entity$/, { timeout: 15_000 });
  await expect(page.getByTestId('entity-focus-demo')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('entity-focus-stage')).toHaveAttribute(
    'data-presentation',
    'panel',
  );

  await setVantage(page, 1);
  await expect(page.getByTestId('entity-focus-stage')).toHaveAttribute(
    'data-presentation',
    'dot',
  );
  await expect(page.getByTestId('entity-presentation-label')).toContainText('Dot');

  await setVantage(page, 12);
  await expect(page.getByTestId('entity-focus-stage')).toHaveAttribute(
    'data-presentation',
    'page',
  );
  await expect(page.getByTestId('entity-presentation-label')).toContainText('Page');

  await page.getByRole('link', { name: 'Collection', exact: true }).click();
  await expect(page).toHaveURL(/\/fractals\/collection$/, { timeout: 15_000 });
  await expect(page.getByTestId('grid-board-projection')).toBeVisible();
});

test('legacy grid route redirects to fractal collection', async ({ page }) => {
  await page.goto('/grid');
  await expect(page).toHaveURL(/\/fractals\/collection$/);
  await expect(page.getByTestId('grid-board-projection')).toBeVisible();
});

test('fractals embed mode and vantage deep-links', async ({ page }) => {
  await page.goto('/fractals/entity?embed=1&vantage=1');
  await expect(page.getByTestId('vantage-dock')).toBeVisible();
  await expect(page.getByTestId('entity-focus-stage')).toHaveAttribute(
    'data-presentation',
    'dot',
    { timeout: 15_000 },
  );
  await expect(page.getByRole('heading', { name: 'Entity' })).toHaveCount(0);

  await page.goto('/fractals/collection?embed=1&vantage=8');
  await expect(page.getByTestId('vantage-dock')).toBeVisible();
  await expect(page.getByTestId('grid-board-projection')).toHaveAttribute(
    'data-board-projection',
    'grid',
    { timeout: 15_000 },
  );
  await expect(page.getByTestId('grid-board-projection')).not.toContainText(
    'No cards yet',
  );
});

test('page demo switches graph, outline, and layout projections', async ({ page }) => {
  await page.goto('/fractals/page');

  await expect(page.getByTestId('page-focus-demo')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('page-focus-projection')).toHaveAttribute(
    'data-page-projection',
    'layout',
  );
  await expect(page.getByTestId('page-layout-surface')).toBeVisible();
  await expect(page.getByTestId('page-layout-surface')).toHaveAttribute(
    'data-page-id',
    'page:decision',
  );

  await setVantage(page, 1);
  await expect(page.getByTestId('page-focus-projection')).toHaveAttribute(
    'data-page-projection',
    'graph',
  );
  await expect(page.getByTestId('page-graph-canvas')).toBeVisible();

  await setVantage(page, 5);
  await expect(page.getByTestId('page-focus-projection')).toHaveAttribute(
    'data-page-projection',
    'outline',
  );
  await expect(page.getByTestId('page-outline-list')).toBeVisible();

  await page.getByTestId('page-outline-list').locator('[data-page-id="page:evidence"]').click();
  await setVantage(page, 11);
  await expect(page.getByTestId('page-layout-surface')).toHaveAttribute(
    'data-page-id',
    'page:evidence',
  );
});

test('page embed deep-link', async ({ page }) => {
  await page.goto('/fractals/page?embed=1&vantage=1');
  await expect(page.locator('.embed-kicker')).toContainText('Fractal page');
  await expect(page.getByTestId('page-focus-projection')).toHaveAttribute(
    'data-page-projection',
    'graph',
    { timeout: 15_000 },
  );
});
