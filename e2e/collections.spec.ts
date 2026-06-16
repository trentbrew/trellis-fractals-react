import { test, expect } from './test';
import type { APIRequestContext, Page } from '@playwright/test';
import {
  IDEAS_RECORD_FIELDS,
  IDEAS_RECORD_ONTOLOGY_ID,
} from '../lib/trellis/demo-ideas-seed.mjs';

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

async function setIdeasDefaultView(request: APIRequestContext, view: string) {
  const res = await request.get('/api/trellis/entities?type=CollectionMeta&limit=100');
  if (!res.ok()) return;
  const json = (await res.json()) as { data?: { id: string; slug?: string }[] };
  const ideas = json.data?.find((entry) => entry.slug === 'ideas');
  if (ideas?.id) {
    await request.patch(`/api/trellis/entities/${ideas.id}`, {
      data: { defaultView: view },
    });
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
    { data: { fields: IDEAS_RECORD_FIELDS } },
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
    // ideas has a `priority` select field → Kanban is an eligible view.
    await expect(picker.getByRole('radio', { name: /Kanban/i })).toHaveCount(1);
    // Gallery and DAG are never eligible collection views — gated out by ontology.
    await expect(picker.getByRole('radio', { name: /Gallery/i })).toHaveCount(0);
    await expect(picker.getByRole('radio', { name: /DAG/i })).toHaveCount(0);
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
    // Presence appends a session `room` param; assert the configure param without anchoring.
    await expect(page).toHaveURL(/\/collections\/ideas\?.*configure=schema/);
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

    // `gallery` is not an eligible collection view → must be sanitized out and fall back.
    const patch = await request.patch(`/api/trellis/entities/${ideasMeta!.id}`, {
      data: { defaultView: 'gallery' },
    });
    expect(patch.ok()).toBeTruthy();

    try {
    const toolbarPicker = page
      .getByTestId('collection-page-toolbar')
      .getByTestId('collection-view-picker');
    await page.reload();
    await expect(page.getByTestId('collection-records')).toBeVisible({ timeout: 15_000 });
    // Ineligible persisted view falls back to the schema-suggested default
    // (ideas has date + lane fields → gantt).
    await expect(toolbarPicker.getByRole('radio', { name: /Gantt/i })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(toolbarPicker.getByRole('radio', { name: /Gallery/i })).toHaveCount(0);
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

  // ADR 0013 / TRL-10 P0 — rich_text renders a Tiptap editor, not a textarea.
  test('rich_text body renders a rich-text editor (not a textarea)', async ({ page }) => {
    await openCollection(page, 'ideas');
    await page.getByTestId('collection-new-record').click();
    const bodyField = page.getByTestId('new-record-body');
    await expect(bodyField).toBeVisible({ timeout: 10_000 });
    await expect(bodyField.locator('.ProseMirror[contenteditable="true"]')).toBeVisible();
    await expect(bodyField.locator('textarea')).toHaveCount(0);
  });

  test('rich_text body edits persist with a visible save state', async ({ page, request }) => {
    let recordId: string | null = null;
    let originalBody: unknown;
    try {
      await setIdeasDefaultView(request, 'list');
      await openCollection(page, 'ideas');
      await expect(page.getByTestId('record-list')).toBeVisible({ timeout: 15_000 });

      recordId = await page
        .getByTestId('record-row')
        .first()
        .getAttribute('data-record-id');
      const before = await request.get('/api/trellis/entities?type=CollectionRecord&limit=200');
      const beforeJson = (await before.json()) as { data?: { id: string; body?: unknown }[] };
      originalBody = beforeJson.data?.find((r) => r.id === recordId)?.body;

      const editor = page
        .getByTestId('record-field-body')
        .locator('.ProseMirror[contenteditable="true"]')
        .first();
      await editor.click();
      await page.keyboard.press('End');
      await page.keyboard.type(' E2E_EDIT');
      // Blur to the toolbar search to trigger the save.
      await page.getByTestId('collection-search').click();

      await expect(
        page.getByTestId('record-field-body-status').first(),
      ).toHaveAttribute('data-save-state', 'saved', { timeout: 15_000 });

      await page.reload();
      await expect(page.getByTestId('record-list')).toBeVisible({ timeout: 15_000 });
      await expect(
        page
          .getByTestId('record-field-body')
          .locator('.ProseMirror')
          .first(),
      ).toContainText('E2E_EDIT', { timeout: 15_000 });
    } finally {
      if (recordId) {
        await request.patch(`/api/trellis/entities/${recordId}`, {
          data: { body: originalBody ?? '' },
        });
      }
      await resetIdeasCollection(request);
    }
  });

  test('entity mention survives the HTML round-trip', async ({ page, request }) => {
    let recordId: string | null = null;
    let originalBody: unknown;
    try {
      await setIdeasDefaultView(request, 'list');
      await openCollection(page, 'ideas');
      await expect(page.getByTestId('record-list')).toBeVisible({ timeout: 15_000 });

      recordId = await page
        .getByTestId('record-row')
        .first()
        .getAttribute('data-record-id');
      expect(recordId).toBeTruthy();

      // Capture the original body so the seed record can be restored afterwards.
      const before = await request.get('/api/trellis/entities?type=CollectionRecord&limit=200');
      const beforeJson = (await before.json()) as { data?: { id: string; body?: unknown }[] };
      originalBody = beforeJson.data?.find((r) => r.id === recordId)?.body;

      const mentionHtml =
        '<p>see <span data-trellis-ref="entity:TRL-10" data-label="Rich text">@Rich text</span></p>';
      const patch = await request.patch(`/api/trellis/entities/${recordId}`, {
        data: { body: mentionHtml },
      });
      expect(patch.ok()).toBeTruthy();

      await page.reload();
      await expect(page.getByTestId('record-list')).toBeVisible({ timeout: 15_000 });
      const mention = page
        .getByTestId('record-field-body')
        .locator('span[data-trellis-ref="entity:TRL-10"]')
        .first();
      await expect(mention).toBeVisible({ timeout: 15_000 });
      await expect(mention).toHaveText('@Rich text');
    } finally {
      if (recordId) {
        await request.patch(`/api/trellis/entities/${recordId}`, {
          data: { body: originalBody ?? '' },
        });
      }
      await resetIdeasCollection(request);
    }
  });
});
