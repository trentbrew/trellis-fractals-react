import { expect, test } from './test';

test('grid board collapses projections by fractal vantage', async ({ page }) => {
  await page.goto('/fractals/collection');

  await expect(page.getByTestId('vantage-control')).toBeVisible({ timeout: 15_000 });
  const presets = page.getByTestId('vantage-presets');
  await expect(presets).toBeVisible();

  const cards = page.locator('[data-card-id]');
  if ((await cards.count()) === 0) {
    await page.getByRole('button', { name: /New card/i }).click();
  }
  await expect(cards.first()).toBeVisible({ timeout: 10_000 });

  await expect(page.getByTestId('grid-board-projection')).toHaveAttribute(
    'data-board-projection',
    'grid',
  );

  await presets.getByRole('radio', { name: 'List preset' }).click();
  await expect(page.getByTestId('grid-board-projection')).toHaveAttribute(
    'data-board-projection',
    'list',
  );
  await expect(page.getByTestId('card-list-projection')).toBeVisible();
  await expect(page.getByTestId('vantage-control')).toContainText('3.5');

  await presets.getByRole('radio', { name: 'Rows preset' }).click();
  await expect(page.getByTestId('grid-board-projection')).toHaveAttribute(
    'data-board-projection',
    'list',
  );
  await expect(cards.first()).toHaveAttribute('data-shell', 'row');
  await expect(page.getByTestId('vantage-control')).toContainText('6.0');

  await presets.getByRole('radio', { name: 'Dense preset' }).click();
  await expect(page.getByTestId('grid-board-projection')).toHaveAttribute(
    'data-board-projection',
    'grid',
  );
  await expect(page.getByTestId('grid-board-projection')).toHaveAttribute(
    'data-effective-cols',
    '6',
  );
  await expect(cards.first()).toHaveAttribute('data-card-variant', 'compact');
  await expect(page.getByTestId('vantage-control')).toContainText('7.0');

  await presets.getByRole('radio', { name: 'Tiles preset' }).click();
  await expect(page.getByTestId('grid-board-projection')).toHaveAttribute(
    'data-board-projection',
    'grid',
  );
  await expect(page.getByTestId('grid-board-projection')).toHaveAttribute(
    'data-effective-cols',
    '5',
  );
  await expect(cards.first()).toHaveAttribute('data-card-variant', 'tile');
  await expect(page.getByTestId('vantage-control')).toContainText('8.0');

  await presets.getByRole('radio', { name: 'Dots preset' }).click();
  await expect(page.getByTestId('grid-board-projection')).toHaveAttribute(
    'data-board-projection',
    'graph',
  );
  await expect(page.getByTestId('card-dot-field')).toBeVisible();
  await expect(page.getByTestId('vantage-control')).toContainText('1.5');

  await presets.getByRole('radio', { name: 'Cards preset' }).click();
  await expect(page.getByTestId('grid-board-projection')).toHaveAttribute(
    'data-board-projection',
    'grid',
  );
  await expect(page.getByTestId('grid-board-projection')).toHaveAttribute(
    'data-effective-cols',
    '4',
  );
  await expect(cards.first()).toHaveAttribute('data-shell', 'card');
  await expect(page.getByTestId('vantage-control')).toContainText('9.0');
});
