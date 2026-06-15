'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCollection } from '@/lib/trellis/use-collection';
import { useTypes } from '@/lib/trellis/use-types';
import {
  CollectionMetaType,
  CollectionRecordType,
  isRecordFieldEmpty,
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
  RecordFieldInput,
} from '@/components/collections/record-field-input';
import { useShell } from '@/lib/shell/shell-context';
import { BrowseProjectionShell } from '@/components/shell/browse-projection-shell';
import { CollectionBrowseToolbar } from '@/components/collections/collection-browse-toolbar';
import {
  CollectionConfigureSheet,
  type ConfigureTab,
} from '@/components/collections/collection-configure-sheet';
import { CollectionInlineHeader } from '@/components/collections/collection-inline-header';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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

function initialRecordFieldValue(field: TypeField): unknown {
  if (field.valueType === 'boolean') return false;
  return '';
}

function parseConfigureTab(value: string | null): ConfigureTab {
  if (value === 'schema') return 'schema';
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
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createFieldErrors, setCreateFieldErrors] = useState<Record<string, string>>({});
  const [newRecordOpen, setNewRecordOpen] = useState(false);
  const [configureAddField, setConfigureAddField] = useState(false);
  const [configureForcedOpen, setConfigureForcedOpen] = useState(false);

  const configureFromUrl = searchParams.get('configure');
  const schemaFromUrl = searchParams.get('schema') === '1';
  const configureTab = parseConfigureTab(configureFromUrl);
  const isConfigureOpen = configureForcedOpen || configureFromUrl != null || schemaFromUrl;

  useEffect(() => {
    if (schemaFromUrl) {
      router.replace(`/collections/${slug}?configure=schema`, { scroll: false });
    }
  }, [schemaFromUrl, router, slug]);

  const filteredListRows = useMemo(
    () => rows.filter((record) => recordMatchesSearch(record, searchQuery, editableFields)),
    [rows, searchQuery, editableFields],
  );

  function resetNewRecordForm() {
    const initial: Record<string, unknown> = {};
    for (const field of editableFields) {
      initial[field.name] = initialRecordFieldValue(field);
    }
    setNewRecordValues(initial);
  }

  function openNewRecordSheet() {
    resetNewRecordForm();
    setCreateError(null);
    setCreateFieldErrors({});
    setNewRecordOpen(true);
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

    const check = validateRecordFromType(editableFields, {
      ...(record as Record<string, unknown>),
      [key]: nextValue,
    });
    if (!check.ok) return;

    await recordMut.update(record.id, { [key]: nextValue } as Parameters<typeof recordMut.update>[1]);
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
  const requiredFields = editableFields.filter((field) => field.required);
  const canCreateRecord =
    requiredFields.length === 0
      ? editableFields.some((field) => !isRecordFieldEmpty(field, newRecordValues[field.name]))
      : requiredFields.every((field) => !isRecordFieldEmpty(field, newRecordValues[field.name]));

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
              onAddColumn={() => openConfigure('schema', true)}
              onDeleteRow={(id) => void recordMut.remove(id)}
              getRowAttributes={(row) => {
                const record = rowById.get(row.id);
                const attrs: Record<string, string> = {
                  'data-testid': 'record-row',
                  'data-record-id': row.id,
                };
                for (const field of editableFields) {
                  attrs[`data-record-${field.name}`] = String(
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
          <CollectionRecordsCardGridView records={filteredListRows} columns={cardGridColumns} />
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
                className="space-y-2 px-4 py-3"
                data-testid="record-row"
                data-record-id={record.id}
              >
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
                    onSave={(value) => void updateRecordField(record, bodyField.name, value)}
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
        onNewRecord={openNewRecordSheet}
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
        hideViewTabs
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
        startWithNewField={configureAddField}
        onSaveTitle={updateMetaTitle}
        onSaveDescription={updateMetaDescription}
        onSaveAppearance={updateAppearance}
        onSaveViews={updateViews}
      />

      <Sheet
        open={newRecordOpen}
        onOpenChange={(open) => {
          setNewRecordOpen(open);
          if (!open) {
            setCreateError(null);
            setCreateFieldErrors({});
          }
        }}
      >
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>New record</SheetTitle>
            <SheetDescription>Add a row to {collection.title}.</SheetDescription>
          </SheetHeader>
          <form className="flex flex-1 flex-col gap-4 px-4" onSubmit={addRecord}>
            {editableFields.map((field) => (
              <div key={field.name} className="space-y-2">
                <label className="text-sm font-medium" htmlFor={`new-record-${field.name}`}>
                  {fieldLabel(field.name)}
                  {field.required ? ' *' : ''}
                </label>
                <RecordFieldInput
                  field={field}
                  id={`new-record-${field.name}`}
                  value={newRecordValues[field.name]}
                  error={createFieldErrors[field.name]}
                  autoFocus={field.name === 'title'}
                  data-testid={`new-record-${field.name}`}
                  onChange={(value) => {
                    setNewRecordValues((prev) => ({ ...prev, [field.name]: value }));
                    if (createFieldErrors[field.name]) {
                      setCreateFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next[field.name];
                        return next;
                      });
                    }
                  }}
                />
              </div>
            ))}
            {createError && (
              <p className="text-sm text-destructive" data-testid="create-record-error">
                {createError}
              </p>
            )}
            <SheetFooter className="px-0 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewRecordOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating || !canCreateRecord}>
                Add record
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <div className="flex min-h-0 flex-1 flex-col">{renderRecordsBody()}</div>
    </BrowseProjectionShell>
  );
}
