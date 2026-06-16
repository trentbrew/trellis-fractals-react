'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PanelRightOpenIcon } from 'lucide-react';
import { useCollection } from '@/lib/trellis/use-collection';
import { useTypes } from '@/lib/trellis/use-types';
import {
  CollectionMetaType,
  CollectionRecordType,
  assertRecordFieldUpdate,
  canSubmitRecordForm,
  normalizeRecordAttributes,
  normalizeRecordFieldValue,
  sortMeta,
  sortRecords,
  validateRecordFromType,
  type CollectionMeta,
  type CollectionRecord,
  type CollectionViewPrefs,
  type TypeField,
} from '@/lib/schemas/collection';
import {
  editableTypeFields,
  fieldLabel,
  typeToSpreadsheetColumns,
  resolveCollectionType,
} from '@/lib/registry/type-columns';
import {
  applyTableColumnPrefs,
  resolveCardGridColumnCount,
  resolvePersistedCollectionView,
  sanitizeCollectionDefaultView,
  sanitizeViewPrefs,
} from '@/lib/registry/collection-view-prefs';
import type { CollectionViewMode } from '@/lib/registry/collection-views';
import { useTypeAppearance } from '@/lib/registry/type-appearance';
import {
  RecordFieldBlurInput,
} from '@/components/collections/record-field-input';
import type {
  MentionCandidate,
  MentionSource,
} from '@/lib/links/trellis-mention';
import { useShell } from '@/lib/shell/shell-context';
import { BrowseProjectionShell } from '@/components/shell/browse-projection-shell';
import { CollectionBrowseToolbar } from '@/components/collections/collection-browse-toolbar';
import {
  CollectionConfigureSheet,
  type ConfigureTab,
} from '@/components/collections/collection-configure-sheet';
import { CollectionInlineHeader } from '@/components/collections/collection-inline-header';
import { RecordFormDialog } from '@/components/forms/shells/record-form-dialog';
import { RecordFormSheet } from '@/components/forms/shells/record-form-sheet';
import { RecordFormWizard } from '@/components/forms/shells/record-form-wizard';
import { emptyRecordValues, recordValuesFromFields } from '@/lib/forms/record-form-values';
import { resolveFormShell } from '@/lib/forms/resolve-form-shell';
import {
  SpreadsheetTable,
  type SpreadsheetColumnFilter,
  type SpreadsheetRow,
} from '@/components/boards/spreadsheet/SpreadsheetTable';
import {
  DEFAULT_GRID_COLUMN_COUNT,
  type GridColumnCount,
} from '@/components/projections/grid-column-count-control';
import { CollectionRecordsCardGridView } from '@/components/collections/views/collection-records-card-grid';
import { CollectionRecordsJsonLdView } from '@/components/collections/views/collection-records-json-ld';
import { Button } from '@/components/ui/button';

function stableCollectionId(collection: CollectionMeta): string {
  return `collectionMeta:${collection.slug}`;
}

function recordBelongsToCollection(record: CollectionRecord, collection: CollectionMeta): boolean {
  return record.collectionId === collection.id || record.collectionId === stableCollectionId(collection);
}

function recordMatchesSearch(
  record: CollectionRecord,
  query: string,
  fields: TypeField[],
): boolean {
  const text = query.trim().toLowerCase();
  if (!text) return true;
  const searchable = [
    record.id,
    ...fields.map((field) => String((record as Record<string, unknown>)[field.name] ?? '')),
  ];
  return searchable.some((value) => value.toLowerCase().includes(text));
}

function parseConfigureTab(value: string | null): ConfigureTab {
  if (value === 'schema') return 'schema';
  if (value === 'form') return 'form';
  if (value === 'views') return 'views';
  return 'general';
}

export function CollectionRecordsProjection({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getSessionViewForSlug, setSessionViewForSlug } = useShell();
  const {types } = useTypes();
  const { rows: metaRows, mut: metaMut, loading: metaLoading } =
    useCollection(CollectionMetaType);

  const collections = useMemo(
    () => sortMeta(metaRows as CollectionMeta[]),
    [metaRows],
  );

  const collection = useMemo(
    () => collections.find((m) => m.slug === slug) ?? null,
    [collections, slug],
  );

  const { getTypeIcon, getTypeColor, trySetTypeAppearance } =
    useTypeAppearance(collections);

  const activeType = useMemo(
    () => resolveCollectionType(types, slug),
    [types, slug],
  );

  const editableFields = useMemo(
    () => editableTypeFields(activeType.fields),
    [activeType.fields],
  );

  const recordColumns = useMemo(
    () => typeToSpreadsheetColumns(activeType.fields),
    [activeType.fields],
  );

  const editableFieldNames = useMemo(
    () => editableFields.map((field) => field.name),
    [editableFields],
  );

  const sanitizedViewPrefs = useMemo(
    () => sanitizeViewPrefs(collection?.viewPrefs, editableFieldNames),
    [collection?.viewPrefs, editableFieldNames],
  );

  const tableColumns = useMemo(
    () => applyTableColumnPrefs(recordColumns, sanitizedViewPrefs?.table),
    [recordColumns, sanitizedViewPrefs],
  );

  const persistedDefaultView = useMemo(
    () =>
      collection
        ? resolvePersistedCollectionView(collection.defaultView, activeType)
        : 'table',
    [collection, activeType],
  );

  const viewMode = useMemo(() => {
    const sessionView = getSessionViewForSlug(slug);
    const sessionEligible = sessionView
      ? sanitizeCollectionDefaultView(sessionView, activeType)
      : undefined;
    return sessionEligible ?? persistedDefaultView;
  }, [slug, activeType, persistedDefaultView, getSessionViewForSlug]);

  function setViewMode(mode: CollectionViewMode) {
    setSessionViewForSlug(slug, mode);
  }

  const persistedCardGridColumns = useMemo(
    () => resolveCardGridColumnCount(sanitizedViewPrefs) ?? DEFAULT_GRID_COLUMN_COUNT,
    [sanitizedViewPrefs],
  );

  const {
    rows: recordRows,
    mut: recordMut,
    loading: recordsLoading,
  } = useCollection(CollectionRecordType);

  const rows = useMemo(
    () =>
      collection
        ? sortRecords((recordRows as CollectionRecord[]).filter((record) => recordBelongsToCollection(record, collection)))
        : [],
    [collection, recordRows],
  );
  const rowById = useMemo(
    () => new Map(rows.map((record) => [record.id, record])),
    [rows],
  );
  const spreadsheetRows = useMemo<SpreadsheetRow[]>(
    () =>
      rows.map((record) => ({
        id: record.id,
        type: record.type,
        values: record as Record<string, unknown>,
      })),
    [rows],
  );

  // Zero-network mention candidates from in-memory graph state (records + collections).
  const mentionSource = useCallback<MentionSource>(
    (query: string) => {
      const q = query.trim().toLowerCase();
      const candidates: MentionCandidate[] = [
        ...rows.map((record) => ({
          id: record.id,
          label: String((record as Record<string, unknown>).title ?? record.id),
          type: 'record',
        })),
        ...collections.map((meta) => ({
          id: meta.id,
          label: meta.title || meta.slug || meta.id,
          type: 'collection',
        })),
      ];
      const filtered = q
        ? candidates.filter((candidate) => candidate.label.toLowerCase().includes(q))
        : candidates;
      return filtered.slice(0, 8);
    },
    [rows, collections],
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [cardGridColumnsBySlug, setCardGridColumnsBySlug] = useState<
    Record<string, GridColumnCount>
  >({});

  const cardGridColumns = cardGridColumnsBySlug[slug] ?? persistedCardGridColumns;

  function setCardGridColumns(columns: GridColumnCount) {
    setCardGridColumnsBySlug((prev) => ({ ...prev, [slug]: columns }));
  }
  const [tableFilters, setTableFilters] = useState<Record<string, SpreadsheetColumnFilter>>({});
  const [newRecordValues, setNewRecordValues] = useState<Record<string, unknown>>({});
  const [pendingEditCell, setPendingEditCell] = useState<{ rowId: string; key: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createFieldErrors, setCreateFieldErrors] = useState<Record<string, string>>({});
  const [newRecordOpen, setNewRecordOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<{
    recordId: string;
    values: Record<string, unknown>;
  } | null>(null);
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [editError, setEditError] = useState<string | null>(null);
  const [savingRecord, setSavingRecord] = useState(false);
  const [viewportWidth, setViewportWidth] = useState<number | undefined>(undefined);
  const [configureAddField, setConfigureAddField] = useState(false);
  const [configureForcedOpen, setConfigureForcedOpen] = useState(false);

  const configureFromUrl = searchParams.get('configure');
  const schemaFromUrl = searchParams.get('schema') === '1';
  const focusRecordId = searchParams.get('record');
  const focusRecord = focusRecordId ? rowById.get(focusRecordId) ?? null : null;
  const configureTab = parseConfigureTab(configureFromUrl);
  const isConfigureOpen = configureForcedOpen || configureFromUrl != null || schemaFromUrl;

  useEffect(() => {
    if (schemaFromUrl) {
      router.replace(`/collections/${slug}?configure=schema`, { scroll: false });
    }
  }, [schemaFromUrl, router, slug]);

  useEffect(() => {
    const update = () => setViewportWidth(window.innerWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const editValues = useMemo(() => {
    if (!focusRecord) return {};
    if (editDraft?.recordId === focusRecord.id) {
      return editDraft.values;
    }
    return recordValuesFromFields(editableFields, focusRecord as Record<string, unknown>);
  }, [focusRecord, editableFields, editDraft]);

  const createShell = useMemo(
    () =>
      resolveFormShell({
        intent: 'create',
        fieldCount: editableFields.length,
        dialogShell: activeType.dialogShell,
        formLayout: activeType.formLayout,
        viewportWidth,
      }),
    [editableFields.length, activeType.dialogShell, activeType.formLayout, viewportWidth],
  );

  const editShell = useMemo(
    () =>
      resolveFormShell({
        intent: 'edit',
        fieldCount: editableFields.length,
        dialogShell: activeType.dialogShell,
        formLayout: activeType.formLayout,
        viewportWidth,
      }),
    [editableFields.length, activeType.dialogShell, activeType.formLayout, viewportWidth],
  );

  const filteredListRows = useMemo(
    () => rows.filter((record) => recordMatchesSearch(record, searchQuery, editableFields)),
    [rows, searchQuery, editableFields],
  );

  function resetNewRecordForm() {
    setNewRecordValues(emptyRecordValues(editableFields));
  }

  function replaceCollectionSearchParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const qs = params.toString();
    router.replace(qs ? `/collections/${slug}?${qs}` : `/collections/${slug}`, { scroll: false });
  }

  function openRecordDialog(recordId: string) {
    replaceCollectionSearchParams((params) => {
      params.set('record', recordId);
    });
  }

  function closeRecordDialog() {
    setEditDraft(null);
    setEditFieldErrors({});
    setEditError(null);
    replaceCollectionSearchParams((params) => {
      params.delete('record');
    });
  }

  function openNewRecordSheet() {
    if (createShell === 'page') {
      router.push(`/collections/${slug}/new`);
      return;
    }
    resetNewRecordForm();
    setCreateError(null);
    setCreateFieldErrors({});
    setNewRecordOpen(true);
  }

  /** Table view: drop a blank row at the top of the list for inline editing (no sheet). */
  async function prependBlankRecord() {
    if (!collection || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const topOrder =
        rows.reduce((min, record) => Math.min(min, record.sortOrder ?? 0), 0) - 1;
      const newId = await recordMut.create({
        collectionId: stableCollectionId(collection),
        sortOrder: topOrder,
        laneId: 'main',
        title: '',
      } as Parameters<typeof recordMut.create>[0]);
      const titleKey =
        editableFields.find((field) => field.name === 'title')?.name ??
        editableFields[0]?.name;
      if (newId && titleKey) {
        setPendingEditCell({ rowId: newId, key: titleKey });
      }
    } finally {
      setCreating(false);
    }
  }

  function handleNewRecord() {
    if (viewMode === 'table') {
      void prependBlankRecord();
      return;
    }
    openNewRecordSheet();
  }

  function handleCreateFieldChange(fieldName: string, value: unknown) {
    setNewRecordValues((prev) => ({ ...prev, [fieldName]: value }));
    if (createFieldErrors[fieldName]) {
      setCreateFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  }

  function handleCreateOpenChange(open: boolean) {
    setNewRecordOpen(open);
    if (!open) {
      setCreateError(null);
      setCreateFieldErrors({});
    }
  }

  async function addRecord(event?: React.FormEvent) {
    event?.preventDefault();
    if (!collection) return;

    const attributes = normalizeRecordAttributes(editableFields, newRecordValues);

    const check = validateRecordFromType(editableFields, attributes);
    if (!check.ok) {
      setCreateError(check.message);
      setCreateFieldErrors(check.fieldErrors);
      return;
    }
    if (creating) return;
    setCreating(true);
    setCreateError(null);
    setCreateFieldErrors({});
    try {
      await recordMut.create({
        collectionId: stableCollectionId(collection),
        sortOrder: rows.length,
        laneId: 'main',
        ...attributes,
      } as Parameters<typeof recordMut.create>[0]);
      resetNewRecordForm();
      setNewRecordOpen(false);
    } finally {
      setCreating(false);
    }
  }

  async function updateRecordField(record: CollectionRecord, key: string, value: unknown) {
    const field = editableFields.find((item) => item.name === key);
    if (!field) return;

    const nextValue = normalizeRecordFieldValue(field, value);
    const current = (record as Record<string, unknown>)[key];
    if (nextValue === current || (nextValue === undefined && current === undefined)) return;

    const nextValues = {
      ...(record as Record<string, unknown>),
      [key]: nextValue,
    };
    assertRecordFieldUpdate(editableFields, nextValues, key);

    await recordMut.update(record.id, { [key]: nextValue } as Parameters<typeof recordMut.update>[1]);
  }

  async function saveFocusedRecord(event?: React.FormEvent) {
    event?.preventDefault();
    if (!focusRecord) return;

    const attributes = normalizeRecordAttributes(editableFields, editValues);
    const check = validateRecordFromType(editableFields, attributes);
    if (!check.ok) {
      setEditError(check.message);
      setEditFieldErrors(check.fieldErrors);
      return;
    }
    if (savingRecord) return;
    setSavingRecord(true);
    setEditError(null);
    setEditFieldErrors({});
    try {
      await recordMut.update(
        focusRecord.id,
        attributes as Parameters<typeof recordMut.update>[1],
      );
      closeRecordDialog();
    } finally {
      setSavingRecord(false);
    }
  }

  function handleEditFieldChange(fieldName: string, value: unknown) {
    if (!focusRecord) return;
    setEditDraft({
      recordId: focusRecord.id,
      values: { ...editValues, [fieldName]: value },
    });
    if (editFieldErrors[fieldName]) {
      setEditFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  }

  async function updateMetaTitle(title: string) {
    if (!collection) return;
    const trimmed = title.trim();
    if (!trimmed || trimmed === collection.title) return;
    await metaMut.update(collection.id, { title: trimmed });
  }

  async function updateMetaDescription(description: string) {
    if (!collection) return;
    const trimmed = description.trim();
    if (trimmed === (collection.description ?? '').trim()) return;
    await metaMut.update(collection.id, { description: trimmed || undefined });
  }

  async function updateAppearanceIcon(icon: string) {
    if (!collection) return;
    const saved = await trySetTypeAppearance(activeType, { icon });
    if (!saved && icon !== collection.icon) {
      await metaMut.update(collection.id, { icon });
    }
  }

  async function updateAppearanceColor(color: string) {
    if (!collection) return;
    const saved = await trySetTypeAppearance(activeType, { color });
    if (!saved && color !== collection.color) {
      await metaMut.update(collection.id, { color });
    }
  }

  async function updateAppearance(updates: { icon?: string; color?: string }) {
    if (updates.icon != null) await updateAppearanceIcon(updates.icon);
    if (updates.color != null) await updateAppearanceColor(updates.color);
  }

  async function updateViews(updates: {
    defaultView?: CollectionViewMode;
    viewPrefs?: CollectionViewPrefs;
  }) {
    if (!collection) return;
    const nextPrefs = sanitizeViewPrefs(updates.viewPrefs, editableFieldNames);
    await metaMut.update(collection.id, {
      defaultView: updates.defaultView,
      viewPrefs: nextPrefs,
    });
    if (updates.defaultView) {
      setSessionViewForSlug(slug, updates.defaultView);
    }
    if (nextPrefs?.cardGrid?.columns != null) {
      setCardGridColumns(nextPrefs.cardGrid.columns);
    } else {
      setCardGridColumnsBySlug((prev) => {
        if (!(slug in prev)) return prev;
        const next = { ...prev };
        delete next[slug];
        return next;
      });
    }
  }

  async function updateRecordCell(id: string, key: string, value: unknown) {
    const record = rowById.get(id);
    if (!record) return;
    await updateRecordField(record, key, value);
  }

  function syncConfigureUrl(tab: ConfigureTab | null) {
    if (tab == null) {
      if (configureFromUrl != null || schemaFromUrl) {
        router.replace(`/collections/${slug}`, { scroll: false });
      }
      return;
    }
    router.replace(`/collections/${slug}?configure=${tab}`, { scroll: false });
  }

  function openConfigure(tab: ConfigureTab = 'general', addField = false) {
    setConfigureAddField(addField);
    setConfigureForcedOpen(true);
    syncConfigureUrl(tab);
  }

  function handleConfigureOpenChange(open: boolean) {
    if (!open) {
      setConfigureForcedOpen(false);
      setConfigureAddField(false);
      syncConfigureUrl(null);
    }
  }

  function handleConfigureTabChange(tab: ConfigureTab) {
    syncConfigureUrl(tab);
  }

  function clearTableFilter(key: string) {
    setTableFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  if (metaLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (!collection) {
    return <h1 className="text-xl font-semibold">Collection not found</h1>;
  }

  const activeCollection = collection;
  const collectionIcon = getTypeIcon(activeType);
  const collectionColor = getTypeColor(
    activeType,
    collections.findIndex((item) => item.slug === slug),
  );
  const variant = viewMode === 'table' ? 'browse' : viewMode;
  const isTableView = viewMode === 'table';
  const titleField = editableFields.find((field) => field.name === 'title') ?? editableFields[0];
  const bodyField = editableFields.find((field) => field.name === 'body');
  const listDetailFields = editableFields.filter(
    (field) => field.name !== titleField?.name,
  );
  const canCreateRecord = canSubmitRecordForm(editableFields, newRecordValues);
  const canSaveFocusedRecord = canSubmitRecordForm(editableFields, editValues);
  const focusRecordTitle =
    String(editValues.title ?? focusRecord?.title ?? '').trim() || 'Record';

  function renderRecordsBody() {
    if (recordsLoading) {
      return (
        <p className="px-4 text-sm text-muted-foreground">Loading records…</p>
      );
    }

    switch (viewMode) {
      case 'table':
        return (
          <div className="flex min-h-0 flex-1 flex-col">
            <SpreadsheetTable
              tableId={`collection-records-${activeCollection.id}`}
              variant="embedded"
              rows={spreadsheetRows}
              columns={tableColumns}
              emptyTitle="No records yet"
              emptyDescription="Use New record to create the first row in this collection."
              showToolbar={false}
              query={searchQuery}
              onQueryChange={setSearchQuery}
              filters={tableFilters}
              onFiltersChange={setTableFilters}
              onUpdateCell={updateRecordCell}
              onOpenRow={(row) => openRecordDialog(row.id)}
              onAddColumn={() => openConfigure('schema', true)}
              onDeleteRow={(id) => void recordMut.remove(id)}
              autoEditCell={pendingEditCell}
              onAutoEditConsumed={() => setPendingEditCell(null)}
              getRowAttributes={(row) => {
                const record = rowById.get(row.id);
                const attrs: Record<string, string> = {
                  'data-testid': 'record-row',
                  'data-record-id': row.id,
                };
                for (const field of editableFields) {
                  attrs[`data-record-${field.name.toLowerCase()}`] = String(
                    (record as Record<string, unknown> | undefined)?.[field.name] ?? '',
                  );
                }
                return attrs;
              }}
            />
          </div>
        );
      case 'json-ld':
        return (
          <div className="flex min-h-0 flex-1 flex-col">
            <CollectionRecordsJsonLdView records={filteredListRows} />
          </div>
        );
      case 'card-grid':
        return (
          <CollectionRecordsCardGridView
            records={filteredListRows}
            columns={cardGridColumns}
            focusRecordId={focusRecordId}
            onOpenRecord={(record) => openRecordDialog(record.id)}
          />
        );
      case 'list':
      default:
        if (filteredListRows.length === 0) {
          return (
            <p className="px-4 text-sm text-muted-foreground">
              {rows.length === 0 ? 'No records yet.' : 'No records match your search.'}
            </p>
          );
        }
        return (
          <ul className="divide-y divide-border" data-testid="record-list">
            {filteredListRows.map((record) => (
              <li
                key={record.id}
                className="flex items-start gap-2 px-4 py-3"
                data-testid="record-row"
                data-record-id={record.id}
              >
                <div className="min-w-0 flex-1 space-y-2">
                {titleField ? (
                  <RecordFieldBlurInput
                    field={titleField}
                    value={(record as Record<string, unknown>)[titleField.name]}
                    className="font-medium"
                    onSave={(value) => void updateRecordField(record, titleField.name, value)}
                    data-testid={`record-field-${titleField.name}`}
                  />
                ) : null}
                {bodyField ? (
                  <RecordFieldBlurInput
                    field={bodyField}
                    value={(record as Record<string, unknown>)[bodyField.name]}
                    className="text-sm text-muted-foreground"
                    presenceKey={record.id}
                    mentionSource={mentionSource}
                    onSave={(value) => updateRecordField(record, bodyField.name, value)}
                    data-testid={`record-field-${bodyField.name}`}
                  />
                ) : null}
                {listDetailFields
                  .filter((field) => field.name !== bodyField?.name)
                  .map((field) => (
                    <div key={field.name} className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {fieldLabel(field.name)}
                      </span>
                      <RecordFieldBlurInput
                        field={field}
                        value={(record as Record<string, unknown>)[field.name]}
                        className="text-sm"
                        onSave={(value) => void updateRecordField(record, field.name, value)}
                        data-testid={`record-field-${field.name}`}
                      />
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground"
                  aria-label="Open record"
                  data-testid="record-open"
                  onClick={() => openRecordDialog(record.id)}
                >
                  <PanelRightOpenIcon className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        );
    }
  }

  return (
    <BrowseProjectionShell
      className="flex min-h-0 flex-1 flex-col"
      data-testid="collection-records"
      data-page-variant={variant}
    >
      <CollectionInlineHeader
        className="px-4 py-4"
        title={collection.title}
        description={collection.description ?? ''}
        icon={collectionIcon}
        color={collectionColor}
        onSaveTitle={(title) => void updateMetaTitle(title)}
        onSaveDescription={(description) => void updateMetaDescription(description)}
        onSaveAppearance={(updates) => void updateAppearance(updates)}
      />

      <CollectionBrowseToolbar
        className="p-2"
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onNewRecord={handleNewRecord}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        typeDefinition={activeType}
        activeFilters={tableFilters}
        filterColumns={tableColumns}
        onClearFilter={clearTableFilter}
        onClearAllFilters={() => setTableFilters({})}
        filtersEnabled={isTableView}
        cardGridColumns={cardGridColumns}
        onCardGridColumnsChange={setCardGridColumns}
      />

      <CollectionConfigureSheet
        open={isConfigureOpen}
        onOpenChange={handleConfigureOpenChange}
        activeTab={configureTab}
        onTabChange={handleConfigureTabChange}
        collection={collection}
        collectionIcon={collectionIcon}
        collectionColor={collectionColor}
        fields={activeType.fields ?? []}
        dialogShell={activeType.dialogShell}
        formLayout={activeType.formLayout}
        startWithNewField={configureAddField}
        onSaveTitle={updateMetaTitle}
        onSaveDescription={updateMetaDescription}
        onSaveAppearance={updateAppearance}
        onSaveViews={updateViews}
      />

      {createShell === 'wizard' ? (
        <RecordFormWizard
          open={newRecordOpen}
          onOpenChange={handleCreateOpenChange}
          title="New record"
          description={`Add a row to ${collection.title}.`}
          fields={editableFields}
          values={newRecordValues}
          fieldErrors={createFieldErrors}
          formError={createError}
          formErrorTestId="create-record-error"
          idPrefix="new-record"
          submitting={creating}
          submitLabel="Add record"
          submitDisabled={!canCreateRecord}
          mentionSource={mentionSource}
          layout={activeType.formLayout}
          onFieldChange={handleCreateFieldChange}
          onSubmit={addRecord}
        />
      ) : createShell === 'sheet' ? (
        <RecordFormSheet
          open={newRecordOpen}
          onOpenChange={handleCreateOpenChange}
          title="New record"
          description={`Add a row to ${collection.title}.`}
          fields={editableFields}
          values={newRecordValues}
          fieldErrors={createFieldErrors}
          formError={createError}
          formErrorTestId="create-record-error"
          idPrefix="new-record"
          submitting={creating}
          submitLabel="Add record"
          submitDisabled={!canCreateRecord}
          mentionSource={mentionSource}
          layout={activeType.formLayout}
          onFieldChange={handleCreateFieldChange}
          onSubmit={addRecord}
        />
      ) : createShell === 'dialog' ? (
        <RecordFormDialog
          open={newRecordOpen}
          onOpenChange={handleCreateOpenChange}
          title="New record"
          description={`Add a row to ${collection.title}.`}
          fields={editableFields}
          values={newRecordValues}
          fieldErrors={createFieldErrors}
          formError={createError}
          formErrorTestId="create-record-error"
          idPrefix="new-record"
          submitting={creating}
          submitLabel="Add record"
          submitDisabled={!canCreateRecord}
          mentionSource={mentionSource}
          layout={activeType.formLayout}
          onFieldChange={handleCreateFieldChange}
          onSubmit={addRecord}
        />
      ) : null}

      {focusRecord && editShell === 'wizard' ? (
        <RecordFormWizard
          open
          onOpenChange={(open) => {
            if (!open) closeRecordDialog();
          }}
          title={focusRecordTitle}
          description={`Edit in ${collection.title}.`}
          fields={editableFields}
          values={editValues}
          fieldErrors={editFieldErrors}
          formError={editError}
          formErrorTestId="edit-record-error"
          idPrefix="edit-record"
          submitting={savingRecord}
          submitLabel="Save"
          submitDisabled={!canSaveFocusedRecord}
          mentionSource={mentionSource}
          layout={activeType.formLayout}
          onFieldChange={handleEditFieldChange}
          onSubmit={saveFocusedRecord}
        />
      ) : focusRecord && editShell === 'sheet' ? (
        <RecordFormSheet
          open
          onOpenChange={(open) => {
            if (!open) closeRecordDialog();
          }}
          title={focusRecordTitle}
          description={`Edit in ${collection.title}.`}
          fields={editableFields}
          values={editValues}
          fieldErrors={editFieldErrors}
          formError={editError}
          formErrorTestId="edit-record-error"
          idPrefix="edit-record"
          submitting={savingRecord}
          submitLabel="Save"
          submitDisabled={!canSaveFocusedRecord}
          mentionSource={mentionSource}
          layout={activeType.formLayout}
          onFieldChange={handleEditFieldChange}
          onSubmit={saveFocusedRecord}
        />
      ) : null}

      {focusRecord && editShell === 'dialog' ? (
        <RecordFormDialog
          open
          onOpenChange={(open) => {
            if (!open) closeRecordDialog();
          }}
          title={focusRecordTitle}
          description={`Edit in ${collection.title}.`}
          fields={editableFields}
          values={editValues}
          fieldErrors={editFieldErrors}
          formError={editError}
          formErrorTestId="edit-record-error"
          idPrefix="edit-record"
          submitting={savingRecord}
          submitLabel="Save"
          submitDisabled={!canSaveFocusedRecord}
          mentionSource={mentionSource}
          layout={activeType.formLayout}
          layoutId={`record-${focusRecord.id}`}
          onFieldChange={handleEditFieldChange}
          onSubmit={saveFocusedRecord}
        />
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col">{renderRecordsBody()}</div>
    </BrowseProjectionShell>
  );
}
