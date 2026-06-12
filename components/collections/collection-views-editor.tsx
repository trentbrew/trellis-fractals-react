'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { CollectionViewPicker } from '@/components/shell/CollectionViewPicker';
import {
  GridColumnCountControl,
  DEFAULT_GRID_COLUMN_COUNT,
  type GridColumnCount,
} from '@/components/projections/grid-column-count-control';
import { fieldLabel, typeToSpreadsheetColumns } from '@/lib/registry/type-columns';
import {
  resolvePersistedCollectionView,
  sanitizeViewPrefs,
} from '@/lib/registry/collection-view-prefs';
import type { CollectionViewMode } from '@/lib/registry/collection-views';
import type { CollectionMeta, CollectionViewPrefs, TypeField } from '@/lib/schemas/collection';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CollectionViewsEditorProps = {
  collection: CollectionMeta;
  fields: TypeField[];
  onDirtyChange?: (dirty: boolean) => void;
  onClose: () => void;
  onRequestClose: (open: boolean) => void;
  onSave: (updates: {
    defaultView?: CollectionViewMode;
    viewPrefs?: CollectionViewPrefs;
  }) => Promise<void>;
};

type ViewsDraft = {
  defaultView: CollectionViewMode;
  hiddenColumns: string[];
  columnOrder: string[];
  cardGridColumns: GridColumnCount;
};

function buildDraft(
  collection: CollectionMeta,
  fields: TypeField[],
): ViewsDraft {
  const columns = typeToSpreadsheetColumns(fields);
  const columnKeys = columns.map((column) => column.key);
  const sanitizedPrefs = sanitizeViewPrefs(collection.viewPrefs, columnKeys);

  const hiddenColumns = sanitizedPrefs?.table?.hiddenColumns ?? [];
  const hiddenSet = new Set(hiddenColumns);
  const savedOrder = sanitizedPrefs?.table?.columnOrder ?? [];
  const columnOrder =
    savedOrder.length > 0
      ? [
          ...savedOrder.filter((key) => columnKeys.includes(key) && !hiddenSet.has(key)),
          ...columnKeys.filter((key) => !savedOrder.includes(key) && !hiddenSet.has(key)),
        ]
      : columnKeys.filter((key) => !hiddenSet.has(key));

  return {
    defaultView: resolvePersistedCollectionView(collection.defaultView, { fields }),
    hiddenColumns,
    columnOrder,
    cardGridColumns:
      sanitizedPrefs?.cardGrid?.columns ?? DEFAULT_GRID_COLUMN_COUNT,
  };
}

function draftSnapshot(draft: ViewsDraft): string {
  return JSON.stringify(draft);
}

function buildViewPrefsFromDraft(
  draft: ViewsDraft,
  fieldNames: string[],
): CollectionViewPrefs | undefined {
  const naturalOrder = fieldNames.filter((key) => !draft.hiddenColumns.includes(key));
  const hasCustomOrder =
    draft.columnOrder.length !== naturalOrder.length ||
    draft.columnOrder.some((key, index) => key !== naturalOrder[index]);

  const viewPrefs: CollectionViewPrefs = {
    table: {
      columnOrder: hasCustomOrder ? draft.columnOrder : undefined,
      hiddenColumns: draft.hiddenColumns.length > 0 ? draft.hiddenColumns : undefined,
    },
    cardGrid:
      draft.cardGridColumns !== DEFAULT_GRID_COLUMN_COUNT
        ? { columns: draft.cardGridColumns }
        : undefined,
  };
  return sanitizeViewPrefs(viewPrefs, fieldNames);
}

export function CollectionViewsEditor({
  collection,
  fields,
  onDirtyChange,
  onClose,
  onRequestClose,
  onSave,
}: CollectionViewsEditorProps) {
  const columns = useMemo(() => typeToSpreadsheetColumns(fields), [fields]);
  const columnKeys = useMemo(() => columns.map((column) => column.key), [columns]);

  const [draft, setDraft] = useState<ViewsDraft>(() => buildDraft(collection, fields));
  const [baselineSnapshot, setBaselineSnapshot] = useState(() =>
    draftSnapshot(buildDraft(collection, fields)),
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const next = buildDraft(collection, fields);
    setDraft(next);
    setBaselineSnapshot(draftSnapshot(next));
    setSaveError(null);
  }, [collection, fields]);

  const isDirty = useMemo(
    () => draftSnapshot(draft) !== baselineSnapshot,
    [draft, baselineSnapshot],
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  function toggleColumnVisibility(key: string) {
    setDraft((prev) => {
      const hidden = new Set(prev.hiddenColumns);
      if (hidden.has(key)) {
        hidden.delete(key);
        const columnOrder = prev.columnOrder.includes(key)
          ? prev.columnOrder
          : [...prev.columnOrder, key];
        return {
          ...prev,
          hiddenColumns: [...hidden],
          columnOrder,
        };
      }
      hidden.add(key);
      return {
        ...prev,
        hiddenColumns: [...hidden],
        columnOrder: prev.columnOrder.filter((columnKey) => columnKey !== key),
      };
    });
  }

  function moveColumn(key: string, direction: -1 | 1) {
    setDraft((prev) => {
      const visibleOrder = prev.columnOrder.filter(
        (columnKey) => !prev.hiddenColumns.includes(columnKey),
      );
      const index = visibleOrder.indexOf(key);
      if (index < 0) return prev;
      const target = index + direction;
      if (target < 0 || target >= visibleOrder.length) return prev;
      const nextOrder = [...visibleOrder];
      [nextOrder[index], nextOrder[target]] = [nextOrder[target], nextOrder[index]];
      return { ...prev, columnOrder: nextOrder };
    });
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const viewPrefs = buildViewPrefsFromDraft(draft, columnKeys);
      await onSave({
        defaultView: draft.defaultView,
        viewPrefs,
      });
      setBaselineSnapshot(draftSnapshot(draft));
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save view preferences');
    } finally {
      setSaving(false);
    }
  }

  const visibleColumnKeys = draft.columnOrder.filter(
    (key) => columnKeys.includes(key) && !draft.hiddenColumns.includes(key),
  );

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      data-testid="collection-views-editor"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
        <section className="space-y-2">
          <h3 className="text-sm font-medium">Default view</h3>
          <p className="text-xs text-muted-foreground">
            Applied when this collection opens. Toolbar view switches are session-only.
          </p>
          <CollectionViewPicker
            variant="sidebar"
            typeDefinition={{ fields }}
            value={draft.defaultView}
            onChange={(mode) => setDraft((prev) => ({ ...prev, defaultView: mode }))}
          />
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-medium">Table columns</h3>
          <p className="text-xs text-muted-foreground">
            Reorder and hide columns in table view.
          </p>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {columnKeys.map((key) => {
              const hidden = draft.hiddenColumns.includes(key);
              const visibleIndex = visibleColumnKeys.indexOf(key);
              return (
                <li
                  key={key}
                  className="flex items-center gap-2 px-3 py-2"
                  data-testid={`views-column-row-${key}`}
                >
                  <span className={cn('min-w-0 flex-1 text-sm', hidden && 'text-muted-foreground')}>
                    {fieldLabel(key)}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={hidden || visibleIndex <= 0}
                      aria-label={`Move ${fieldLabel(key)} up`}
                      onClick={() => moveColumn(key, -1)}
                    >
                      <ChevronUpIcon className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={hidden || visibleIndex < 0 || visibleIndex >= visibleColumnKeys.length - 1}
                      aria-label={`Move ${fieldLabel(key)} down`}
                      onClick={() => moveColumn(key, 1)}
                    >
                      <ChevronDownIcon className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={hidden ? `Show ${fieldLabel(key)}` : `Hide ${fieldLabel(key)}`}
                      data-testid={`views-column-toggle-${key}`}
                      onClick={() => toggleColumnVisibility(key)}
                    >
                      {hidden ? (
                        <EyeOffIcon className="size-4 text-muted-foreground" />
                      ) : (
                        <EyeIcon className="size-4" />
                      )}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-medium">Card grid density</h3>
          <p className="text-xs text-muted-foreground">
            Default column count for card grid view.
          </p>
          <GridColumnCountControl
            value={draft.cardGridColumns}
            onChange={(columns) => setDraft((prev) => ({ ...prev, cardGridColumns: columns }))}
          />
        </section>

        {saveError ? <p className="text-sm text-destructive">{saveError}</p> : null}
      </div>

      <div className="mt-auto flex justify-end gap-2 border-t border-border px-4 py-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onRequestClose(false)}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || !isDirty}
          data-testid="views-save"
        >
          {saving ? 'Saving…' : 'Save views'}
        </Button>
      </div>
    </div>
  );
}
