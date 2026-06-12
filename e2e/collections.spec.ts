import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

const IDEAS_RECORD_ONTOLOGY_ID = 'https://trellis.dev/ns/demo/v1/collections/ideas/Record';

const DEFAULT_IDEAS_RECORD_FIELDS = [
  { name: 'title', valueType: 'title', required: true },
  { name: 'body', valueType: 'rich_text' },
  { name: 'collectionId', valueType: 'rich_text', required: true },
  { name: 'sortOrder', valueType: 'number' },
  { name: 'laneId', valueType: 'rich_text' },
];

async function deleteUntitledCollections(request: APIRequestContext) {
  const res = await request.get('/api/trellis/entities?type=CollectionMeta&limit=500');
  if (!res.ok()) return;
  const json = (await res.json()) as { data?: { id: string; slug?: string }[] };
  const stray = (json.data ?? []).filter((entry) =>
    /^untitled-collection(-\d+)?$/.test(entry.slug ?? ''),
  );
  for (const meta of stray) {
    await request.delete(`/api/trellis/entities/${meta.id}`);
  }
}

async function resetIdeasCollection(request: APIRequestContext) {
  const res = await request.get('/api/trellis/entities?type=CollectionMeta&limit=100');
  if (!res.ok()) return;
  const json = (await res.json()) as { data?: { id: string; slug?: string }[] };
  const ideas = json.data?.find((entry) => entry.slug === 'ideas');
  if (ideas?.id) {
    await request.patch(`/api/trellis/entities/${ideas.id}`, {
      data: { defaultView: 'table', viewPrefs: {} },
    });
  }
  await request.patch(
    `/api/trellis/ontologies/${encodeURIComponent(IDEAS_RECORD_ONTOLOGY_ID)}`,
    { data: { fields: DEFAULT_IDEAS_RECORD_FIELDS } },
  );
}

async function gotoHome(page: Page) {
  await page.goto('/collections');
  await expect(page.getByTestId('collections-home')).toBeVisible({ timeout: 15_000 });
}

async function openCollection(page: Page, slug: string) {
  await gotoHome(page);
  await page.locator(`[data-testid="collection-card"][data-slug="${slug}"]`).click();
  await expect(page.getByTestId('collection-records')).toBeVisible({ timeout: 10_000 });
}

test.describe('Collections live platform', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ request }) => {
    await deleteUntitledCollections(request);
    await resetIdeasCollection(request);
  });

  test('home lists seeded collections', async ({ page }) => {
    await gotoHome(page);
    await expect(page.getByTestId('collection-grid')).toBeVisible();
    await expect(page.getByTestId('collection-card').first()).toBeVisible();
  });

  test('seeded records show body text', async ({ page }) => {
    await openCollection(page, 'ideas');
    await expect(
      page.locator(
        '[data-record-title="Fractal shell contract"][data-record-body*="representation"]',
      ),
    ).toBeVisible();
  });

  test('collection view picker gates by ontology', async ({ page }) => {
    await openCollection(page, 'ideas');
    const picker = page.getByTestId('collection-view-picker');
    await expect(picker).toBeVisible();
    await expect(picker.getByRole('radio', { name: /Table/i })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(picker.getByRole('radio', { name: /Kanban/i })).toHaveCount(0);
  });

  test('card grid is always eligible; dag and gallery hidden; json-ld renders on switch', async ({ page }) => {
    await openCollection(page, 'ideas');
    const picker = page.getByTestId('collection-view-picker');

    await expect(picker.getByRole('radio', { name: /^Grid$/i })).toBeVisible();
    await expect(picker.getByRole('radio', { name: /Gallery/i })).toHaveCount(0);
    await expect(picker.getByRole('radio', { name: /DAG/i })).toHaveCount(0);

    await picker.getByRole('radio', { name: /^Grid$/i }).click();
    await expect(page.locator('[data-page-variant="card-grid"]')).toBeVisible();
    await expect(page.getByTestId('collection-card-grid-view')).toBeVisible();

    await picker.getByRole('radio', { name: /JSON-LD/i }).click();
    await expect(page.locator('[data-page-variant="json-ld"]')).toBeVisible();
    await expect(page.getByTestId('collection-json-ld-view')).toBeVisible();
  });

  test('configure trigger opens general tab by default', async ({ page }) => {
    await openCollection(page, 'ideas');
    await page.getByTestId('collection-configure-trigger').click();
    await expect(page.getByTestId('collection-configure-sheet')).toBeVisible();
    await expect(page.getByTestId('collection-configure-general')).toBeVisible();
    await expect(page.getByTestId('collection-configure-tab-general')).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  test('configure trigger opens collection schema editor', async ({ page }) => {
    await openCollection(page, 'ideas');
    await page.getByTestId('collection-configure-trigger').click();
    await page.getByTestId('collection-configure-tab-schema').click();
    await expect(page.getByTestId('collection-configure-sheet')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('collection-schema-editor')).toBeVisible();
    await expect(page).toHaveURL(/\/collections\/ideas\?configure=schema$/);
  });

  test('browse variant shows toolbar; types route reachable from sidebar', async ({ page }) => {
    await openCollection(page, 'ideas');
    await expect(page.getByTestId('collection-page-toolbar')).toBeVisible();
    await expect(page.getByTestId('collection-search')).toBeVisible();
    await expect(page.getByTestId('collection-new-record')).toBeVisible();
    await expect(page.getByTestId('collection-view-picker')).toBeVisible();
    await expect(page.locator('[data-page-variant="browse"]')).toBeVisible();
    await page.getByTestId('sidebar-manage-types').click();
    await expect(page.getByTestId('types-home')).toBeVisible();
    await expect(page.getByTestId('types-create-name')).toBeVisible();
  });

  test('sidebar add creates untitled collection', async ({ page }) => {
    await gotoHome(page);
    await expect(page.getByTestId('collection-card').first()).toBeVisible({ timeout: 15_000 });
    const untitledCards = page.locator(
      '[data-testid="collection-card"][data-slug^="untitled-collection"]',
    );
    const countBefore = await untitledCards.count();
    await page.getByTestId('sidebar-add-collection').click();
    await expect(untitledCards).toHaveCount(countBefore + 1, { timeout: 10_000 });
    await expect(untitledCards.last()).toHaveAttribute(
      'data-slug',
      /^untitled-collection(-\d+)?$/,
    );
  });

  test('add field from table header updates visible columns', async ({ page }) => {
    await openCollection(page, 'ideas');
    const suffix = Date.now();
    const fieldKey = `e2e_field_${suffix}`;

    await page.getByTestId('spreadsheet-add-column').click();
    await expect(page.getByTestId('collection-configure-sheet')).toBeVisible();
    await expect(page.getByTestId('collection-schema-editor')).toBeVisible();

    await page.getByTestId('schema-field-key').last().fill(fieldKey);
    const saveSchema = page.getByRole('button', { name: /Save schema/i });
    await expect(saveSchema).toBeEnabled({ timeout: 10_000 });
    await saveSchema.click();
    await expect(page.getByTestId('collection-configure-sheet')).toBeHidden({ timeout: 10_000 });

    await expect(
      page
        .getByTestId('collection-records')
        .getByTitle(`Sort by E2e Field ${suffix}`),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('views tab deep link opens configure views panel', async ({ page }) => {
    await openCollection(page, 'ideas');
    await page.goto('/collections/ideas?configure=views');
    await expect(page.getByTestId('collection-records')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('collection-configure-sheet')).toBeVisible();
    await expect(page.getByTestId('collection-configure-views')).toBeVisible();
    await expect(page.getByTestId('collection-views-editor')).toBeVisible();
    await expect(page.getByTestId('collection-configure-tab-views')).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  test('default card-grid view persists across reload', async ({ page }) => {
    await openCollection(page, 'ideas');
    await page.getByTestId('collection-configure-trigger').click();
    await page.getByTestId('collection-configure-tab-views').click();
    await expect(page.getByTestId('collection-views-editor')).toBeVisible();

    const viewsEditor = page.getByTestId('collection-views-editor');
    await viewsEditor.getByRole('radio', { name: /List/i }).click();
    await viewsEditor.getByRole('radio', { name: /^Grid$/i }).click();
    await expect(page.getByTestId('views-save')).toBeEnabled();
    await page.getByTestId('views-save').click();
    await expect(page.getByTestId('collection-configure-sheet')).toBeHidden({ timeout: 10_000 });

    await page.reload();
    await expect(page.getByTestId('collection-records')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-page-variant="card-grid"]')).toBeVisible();
    await expect(page.getByTestId('collection-card-grid-view')).toBeVisible();
  });

  test('hidden table columns persist across reload', async ({ page }) => {
    await openCollection(page, 'ideas');
    await page.getByTestId('collection-configure-trigger').click();
    await page.getByTestId('collection-configure-tab-views').click();
    await page.getByTestId('views-column-toggle-body').click();
    await expect(page.getByTestId('views-save')).toBeEnabled();
    await page.getByTestId('views-save').click();
    await expect(page.getByTestId('collection-configure-sheet')).toBeHidden({ timeout: 10_000 });

    const records = page.getByTestId('collection-records');
    const toolbarPicker = page.getByTestId('collection-page-toolbar').getByTestId('collection-view-picker');
    await toolbarPicker.getByRole('radio', { name: /Table/i }).click();
    await expect(records.getByRole('button', { name: 'Body' })).toHaveCount(0);
    await page.reload();
    await expect(records).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('collection-page-toolbar').getByTestId('collection-view-picker').getByRole('radio', { name: /Table/i }).click();
    await expect(records.getByRole('button', { name: 'Body' })).toHaveCount(0);
    await expect(records.getByRole('button', { name: 'Required Title' })).toBeVisible();
  });

  test('invalid default view falls back after schema change', async ({ page, request }) => {
    await openCollection(page, 'ideas');
    const metaRes = await request.get('/api/trellis/entities?type=CollectionMeta&limit=50');
    expect(metaRes.ok()).toBeTruthy();
    const metaJson = (await metaRes.json()) as {
      data?: { id: string; slug?: string }[];
    };
    const ideasMeta = metaJson.data?.find((entry) => entry.slug === 'ideas');
    expect(ideasMeta?.id).toBeTruthy();

    const patch = await request.patch(`/api/trellis/entities/${ideasMeta!.id}`, {
      data: { defaultView: 'kanban' },
    });
    expect(patch.ok()).toBeTruthy();

    try {
    const toolbarPicker = page
      .getByTestId('collection-page-toolbar')
      .getByTestId('collection-view-picker');
    await page.reload();
    await expect(page.getByTestId('collection-records')).toBeVisible({ timeout: 15_000 });
    await expect(toolbarPicker.getByRole('radio', { name: /Table/i })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(toolbarPicker.getByRole('radio', { name: /Kanban/i })).toHaveCount(0);
    await expect(page.locator('[data-page-variant="browse"]')).toBeVisible();
    } finally {
      await resetIdeasCollection(request);
    }
  });

  test('views tab participates in discard dialog', async ({ page }) => {
    await openCollection(page, 'ideas');
    await page.getByTestId('collection-configure-trigger').click();
    await page.getByTestId('collection-configure-tab-views').click();
    await page
      .getByTestId('collection-views-editor')
      .getByRole('radio', { name: /^Grid$/i })
      .click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByTestId('configure-discard-dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Keep editing' }).click();
    await expect(page.getByTestId('collection-configure-sheet')).toBeVisible();
  });
});
