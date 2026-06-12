import type { SpreadsheetColumn } from '@/components/boards/spreadsheet/SpreadsheetTable';
import {
  GRID_COLUMN_OPTIONS,
  type GridColumnCount,
} from '@/components/projections/grid-column-count-control';
import {
  eligibleCollectionViewsFromDefinition,
  suggestDefaultCollectionViewFromDefinition,
  type CollectionViewMode,
} from '@/lib/registry/collection-views';
import type { CollectionViewPrefs } from '@/lib/schemas/collection';

type TableViewPrefs = {
  columnOrder?: string[];
  hiddenColumns?: string[];
};

type TypeDefinitionLike = {
  fields?: { name: string; valueType?: string }[];
};

/** Returns defaultView when still eligible; otherwise undefined. */
export function sanitizeCollectionDefaultView(
  defaultView: CollectionViewMode | undefined,
  type: TypeDefinitionLike,
): CollectionViewMode | undefined {
  if (!defaultView) return undefined;
  const eligible = eligibleCollectionViewsFromDefinition(type);
  return eligible.some((option) => option.mode === defaultView) ? defaultView : undefined;
}

/** Persisted default with type gate, else schema-driven suggestion. */
export function resolvePersistedCollectionView(
  defaultView: CollectionViewMode | undefined,
  type: TypeDefinitionLike,
): CollectionViewMode {
  return (
    sanitizeCollectionDefaultView(defaultView, type) ??
    suggestDefaultCollectionViewFromDefinition(type)
  );
}

export function applyTableColumnPrefs(
  columns: SpreadsheetColumn[],
  prefs?: TableViewPrefs,
): SpreadsheetColumn[] {
  const validKeys = new Set(columns.map((column) => column.key));
  const hidden = new Set(
    (prefs?.hiddenColumns ?? []).filter((key) => validKeys.has(key)),
  );
  const visible = columns.filter((column) => !hidden.has(column.key));

  const order = (prefs?.columnOrder ?? []).filter(
    (key) => validKeys.has(key) && !hidden.has(key),
  );
  if (order.length === 0) return visible;

  const byKey = new Map(visible.map((column) => [column.key, column]));
  const ordered: SpreadsheetColumn[] = [];
  for (const key of order) {
    const column = byKey.get(key);
    if (column) {
      ordered.push(column);
      byKey.delete(key);
    }
  }
  for (const column of visible) {
    if (byKey.has(column.key)) ordered.push(column);
  }
  return ordered;
}

export function sanitizeViewPrefs(
  prefs: CollectionViewPrefs | undefined,
  fieldNames: string[],
): CollectionViewPrefs | undefined {
  if (!prefs) return undefined;

  const validKeys = new Set(fieldNames);
  const result: CollectionViewPrefs = {};

  if (prefs.table) {
    const table: TableViewPrefs = {};
    if (prefs.table.columnOrder?.length) {
      const columnOrder = prefs.table.columnOrder.filter((key) => validKeys.has(key));
      if (columnOrder.length > 0) table.columnOrder = columnOrder;
    }
    if (prefs.table.hiddenColumns?.length) {
      const hiddenColumns = prefs.table.hiddenColumns.filter((key) => validKeys.has(key));
      if (hiddenColumns.length > 0) table.hiddenColumns = hiddenColumns;
    }
    if (Object.keys(table).length > 0) result.table = table;
  }

  if (
    prefs.cardGrid?.columns != null &&
    GRID_COLUMN_OPTIONS.includes(prefs.cardGrid.columns as GridColumnCount)
  ) {
    result.cardGrid = { columns: prefs.cardGrid.columns as GridColumnCount };
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

export function resolveCardGridColumnCount(
  prefs: CollectionViewPrefs | undefined,
): GridColumnCount | undefined {
  const columns = prefs?.cardGrid?.columns;
  if (columns != null && GRID_COLUMN_OPTIONS.includes(columns as GridColumnCount)) {
    return columns as GridColumnCount;
  }
  return undefined;
}
