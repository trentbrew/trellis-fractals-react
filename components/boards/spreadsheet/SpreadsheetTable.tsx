'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  CopyIcon,
  FilterIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import { htmlToPlainText, plainTextToRichHtml } from '@/lib/links/trellis-mention';
import { formatFieldDisplayValue } from '@/lib/registry/field-constraints';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { DatePicker } from '@/components/ui/date-picker';
import {
  SELECT_EMPTY_VALUE,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ColorFieldControl,
  IconFieldControl,
} from '@/components/collections/record-field-special';
import {
  formatRecordDateLabel,
  recordColorDisplay,
  recordIconDisplay,
} from '@/lib/record-field-utils';
import { useBoardPresence } from '@/lib/presence/context';
import { cellFocusKey, remoteCellFocusHolders, remoteFocusedCellSlotsKey } from '@/lib/presence/cell-focus';
import {
  applyRemoteFieldValue,
  cancelCaretSync,
  isTextFieldActive,
  scheduleCaretSync,
  utf16ToCodePointIndex,
} from '@/lib/presence/text-editing';
import { useCellTextSync } from '@/lib/presence/use-cell-text-sync';
import { BoardPresenceSurface } from '@/components/presence/board-presence-surface';
import { MeasuredRemoteCarets } from '@/components/presence/measured-remote-carets';
import { RemoteCellNameBadges } from '@/components/presence/remote-cell-name-badges';

import type { TypeFieldFormat } from '@/lib/schemas/record-fields';

export type SpreadsheetCellKind =
  | 'text'
  | 'longtext'
  | 'number'
  | 'date'
  | 'color'
  | 'icon'
  | 'boolean'
  | 'select'
  | 'reference'
  | 'formula'
  | 'readonly';

export type SpreadsheetColumn = {
  key: string;
  label: string;
  kind?: SpreadsheetCellKind;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  required?: boolean;
  readOnly?: boolean;
  options?: string[];
  formula?: string;
  min?: number;
  max?: number;
  step?: number;
  minLength?: number;
  maxLength?: number;
  format?: TypeFieldFormat;
  currency?: string;
  includeTime?: boolean;
  valueType?: string;
};

export type SpreadsheetRow = {
  id: string;
  type?: string;
  values: Record<string, unknown>;
};

export type SpreadsheetSort = {
  key: string | null;
  dir: 'asc' | 'desc';
};

type BooleanFilterValue = 'true' | 'false' | 'empty';

export type SpreadsheetColumnFilter =
  | { kind: 'contains'; text: string }
  | { kind: 'range'; min?: number; max?: number }
  | { kind: 'values'; values: string[] }
  | { kind: 'boolean'; values: BooleanFilterValue[] };

type EditingCell = { rowId: string; key: string } | null;
type PendingCell = { value: unknown; seq: number };

type SpreadsheetTableProps = {
  tableId: string;
  rows: SpreadsheetRow[];
  columns: SpreadsheetColumn[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  createLabel?: string;
  onCreateRow?: () => Promise<void> | void;
  /** Begin inline editing of this cell once the row exists (e.g. a freshly created row). */
  autoEditCell?: { rowId: string; key: string } | null;
  /** Called after {@link autoEditCell} has been applied so the parent can clear it. */
  onAutoEditConsumed?: () => void;
  showToolbar?: boolean;
  query?: string;
  onQueryChange?: (query: string) => void;
  filters?: Record<string, SpreadsheetColumnFilter>;
  onFiltersChange?: (filters: Record<string, SpreadsheetColumnFilter>) => void;
  onUpdateCell: (rowId: string, key: string, value: unknown) => Promise<void> | void;
  onOpenRow?: (row: SpreadsheetRow) => void;
  onDeleteRow?: (rowId: string) => Promise<void> | void;
  onRowContextMenu?: (event: React.MouseEvent, row: SpreadsheetRow) => void;
  getRowAttributes?: (row: SpreadsheetRow) => React.HTMLAttributes<HTMLDivElement> & {
    [key: `data-${string}`]: string | number | undefined;
  };
  onAddColumn?: () => void;
  addColumnLabel?: string;
  /** Flush layout for collection browse — no outer chrome, page background. */
  variant?: 'default' | 'embedded';
};

const ROW_HEIGHT = 42;
const OVERSCAN = 10;
const CHECK_WIDTH = 36;
const INDEX_WIDTH = 40;
const DEFAULT_ID_WIDTH = 136;
const ACTION_WIDTH = 40;
const ADD_COLUMN_WIDTH = 112;
const DEFAULT_COL_WIDTH = 180;
const COL_MIN = 80;
const COL_MAX = 480;
const WIDTH_STORAGE_PREFIX = 'spreadsheet:column-widths:';

function clampColumnWidth(width: number, column?: SpreadsheetColumn) {
  const min = column?.minWidth ?? COL_MIN;
  const max = column?.maxWidth ?? COL_MAX;
  return Math.min(max, Math.max(min, width));
}

function cellSlot(rowId: string, key: string) {
  return `${rowId}\u0000${key}`;
}

function labelValue(value: unknown, column?: SpreadsheetColumn): string {
  if (value === undefined || value === null || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  const kind = column?.kind ?? 'text';
  if (typeof value === 'number') {
    if (column?.format) {
      return formatFieldDisplayValue(
        {
          name: column.key,
          valueType: 'number',
          format: column.format,
          currency: column.currency,
        },
        value,
      );
    }
    return value.toLocaleString();
  }
  if (kind === 'color') return recordColorDisplay(value) || '-';
  if (kind === 'icon') return recordIconDisplay(value) || '-';
  if (kind === 'date') return formatRecordDateLabel(value) || '-';
  if (kind === 'longtext') return htmlToPlainText(value) || '-';
  return String(value);
}

function searchableValue(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value).toLowerCase();
}

function compareValues(a: unknown, b: unknown) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);

  const an = typeof a === 'string' && a.trim() ? Number(a) : Number.NaN;
  const bn = typeof b === 'string' && b.trim() ? Number(b) : Number.NaN;
  if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;

  const ad = Date.parse(String(a));
  const bd = Date.parse(String(b));
  if (!Number.isNaN(ad) && !Number.isNaN(bd)) return ad - bd;

  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

function dateInputValue(value: unknown): string {
  if (!value) return '';
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

function castDraft(value: string, column: SpreadsheetColumn): unknown {
  const kind = column.kind ?? 'text';
  if (kind === 'number') {
    const n = Number(value);
    return value.trim() === '' || !Number.isFinite(n) ? undefined : n;
  }
  if (kind === 'date') return value.trim() || undefined;
  if (kind === 'longtext' && column.valueType === 'rich_text') {
    return plainTextToRichHtml(value);
  }
  return value.trim() === '' ? undefined : value;
}

function displayDraft(value: unknown, column: SpreadsheetColumn) {
  if (column.kind === 'date') return dateInputValue(value);
  if (column.kind === 'longtext') return htmlToPlainText(value);
  return value === undefined || value === null ? '' : String(value);
}

function editableTextLength(value: unknown, column: SpreadsheetColumn): number {
  if (column.kind === 'longtext') return htmlToPlainText(value).length;
  return String(value ?? '').length;
}

function isEditableTextColumn(column: SpreadsheetColumn) {
  const kind = column.kind ?? 'text';
  return !column.readOnly && (kind === 'text' || kind === 'longtext' || kind === 'number');
}

function isEmpty(value: unknown) {
  return value === undefined || value === null || value === '';
}

export function spreadsheetFilterSummary(filter: SpreadsheetColumnFilter) {
  if (filter.kind === 'contains') return `"${filter.text}"`;
  if (filter.kind === 'range') return `${filter.min ?? '*'}...${filter.max ?? '*'}`;
  if (filter.kind === 'values') return filter.values.join(', ');
  return filter.values.join(', ');
}

function valueForFilter(value: unknown) {
  if (value === undefined || value === null || value === '') return '';
  return String(value);
}

function passesFilter(value: unknown, filter: SpreadsheetColumnFilter) {
  if (filter.kind === 'contains') {
    const text = filter.text.trim().toLowerCase();
    return !text || searchableValue(value).includes(text);
  }
  if (filter.kind === 'range') {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (filter.min !== undefined && (!Number.isFinite(numeric) || numeric < filter.min)) return false;
    if (filter.max !== undefined && (!Number.isFinite(numeric) || numeric > filter.max)) return false;
    return true;
  }
  if (filter.kind === 'values') {
    if (filter.values.length === 0) return true;
    return filter.values.includes(valueForFilter(value));
  }
  if (filter.values.length === 0) return true;
  const key: BooleanFilterValue = value === true ? 'true' : value === false ? 'false' : 'empty';
  return filter.values.includes(key);
}

function readStoredWidths(tableId: string) {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(`${WIDTH_STORAGE_PREFIX}${tableId}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => Number.isFinite(value)),
    );
  } catch {
    return {};
  }
}

function useColumnWidths(tableId: string) {
  const [widths, setWidths] = useState<Record<string, number>>(() => readStoredWidths(tableId));

  const persist = useCallback(
    (next: Record<string, number>) => {
      setWidths(next);
      window.localStorage.setItem(`${WIDTH_STORAGE_PREFIX}${tableId}`, JSON.stringify(next));
    },
    [tableId],
  );

  const setColumnWidth = useCallback(
    (key: string, width: number, column?: SpreadsheetColumn) => {
      const next = { ...widths, [key]: clampColumnWidth(width, column) };
      persist(next);
    },
    [persist, widths],
  );

  const resetColumnWidth = useCallback(
    (key: string) => {
      const next = { ...widths };
      delete next[key];
      persist(next);
    },
    [persist, widths],
  );

  return { widths, setColumnWidth, resetColumnWidth };
}

function ColumnResizeHandle({
  width,
  column,
  onResize,
  onReset,
}: {
  width: number;
  column?: SpreadsheetColumn;
  onResize: (width: number) => void;
  onReset: () => void;
}) {
  return (
    <div
      className="absolute top-0 right-0 z-30 h-full w-1.5 cursor-col-resize touch-none hover:bg-border active:bg-border"
      title="Drag to resize. Double-click to reset."
      onDoubleClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onReset();
      }}
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const origin = event.clientX;
        const start = width;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        const move = (moveEvent: MouseEvent) => {
          onResize(clampColumnWidth(start + moveEvent.clientX - origin, column));
        };
        const up = () => {
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          document.removeEventListener('mousemove', move);
          document.removeEventListener('mouseup', up);
        };
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
      }}
    />
  );
}

function useVirtualRows(count: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState({ top: 0, height: 0 });

  const measure = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;
    setViewport({ top: element.scrollTop, height: element.clientHeight });
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    measure(element);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => measure(element));
    observer.observe(element);
    return () => observer.disconnect();
  }, [measure]);

  const range = useMemo(() => {
    const height = viewport.height || 600;
    const start = Math.max(0, Math.floor(viewport.top / ROW_HEIGHT) - OVERSCAN);
    const end = Math.min(count, Math.ceil((viewport.top + height) / ROW_HEIGHT) + OVERSCAN);
    return { start, end };
  }, [count, viewport.height, viewport.top]);

  return { ref, measure, range };
}

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <ArrowUpDownIcon className="size-3 text-muted-foreground/70" />;
  return dir === 'asc' ? (
    <ArrowUpIcon className="size-3 text-foreground" />
  ) : (
    <ArrowDownIcon className="size-3 text-foreground" />
  );
}

function ColumnFilterMenu({
  column,
  filter,
  values,
  onFilter,
}: {
  column: SpreadsheetColumn;
  filter?: SpreadsheetColumnFilter;
  values: string[];
  onFilter: (filter: SpreadsheetColumnFilter | undefined) => void;
}) {
  const kind = column.kind ?? 'text';
  const active = !!filter;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={cn(
              'flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground',
              active && 'text-primary',
            )}
            aria-label={`Filter ${column.label}`}
            title={`Filter ${column.label}`}
          >
            <FilterIcon className="size-3" />
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-56 p-2">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-1">Filter {column.label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {kind === 'boolean' ? (
            <div className="space-y-1 py-1">
              {(['true', 'false', 'empty'] as BooleanFilterValue[]).map((value) => {
                const current = filter?.kind === 'boolean' ? filter.values : [];
                return (
                  <DropdownMenuCheckboxItem
                    key={value}
                    checked={current.includes(value)}
                    onCheckedChange={(checked) => {
                      const next = checked
                        ? [...current, value]
                        : current.filter((item) => item !== value);
                      onFilter(next.length ? { kind: 'boolean', values: next } : undefined);
                    }}
                  >
                    {value === 'true' ? 'True' : value === 'false' ? 'False' : 'Empty'}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </div>
          ) : kind === 'select' && values.length > 0 ? (
            <div className="max-h-56 space-y-1 overflow-auto py-1">
              {values.map((value) => {
                const current = filter?.kind === 'values' ? filter.values : [];
                return (
                  <DropdownMenuCheckboxItem
                    key={value}
                    checked={current.includes(value)}
                    onCheckedChange={(checked) => {
                      const next = checked
                        ? [...current, value]
                        : current.filter((item) => item !== value);
                      onFilter(next.length ? { kind: 'values', values: next } : undefined);
                    }}
                  >
                    {value || 'Empty'}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </div>
          ) : kind === 'number' ? (
            <div className="space-y-2 p-1" onKeyDown={(event) => event.stopPropagation()}>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1">
                <input
                  type="number"
                  step="any"
                  className="h-7 min-w-0 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-ring"
                  placeholder="Min"
                  value={filter?.kind === 'range' && filter.min !== undefined ? filter.min : ''}
                  onChange={(event) => {
                    const min = event.currentTarget.value === '' ? undefined : Number(event.currentTarget.value);
                    const max = filter?.kind === 'range' ? filter.max : undefined;
                    onFilter(min === undefined && max === undefined ? undefined : { kind: 'range', min, max });
                  }}
                />
                <span className="text-muted-foreground">-</span>
                <input
                  type="number"
                  step="any"
                  className="h-7 min-w-0 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-ring"
                  placeholder="Max"
                  value={filter?.kind === 'range' && filter.max !== undefined ? filter.max : ''}
                  onChange={(event) => {
                    const min = filter?.kind === 'range' ? filter.min : undefined;
                    const max = event.currentTarget.value === '' ? undefined : Number(event.currentTarget.value);
                    onFilter(min === undefined && max === undefined ? undefined : { kind: 'range', min, max });
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="p-1" onKeyDown={(event) => event.stopPropagation()}>
              <input
                type="text"
                className="h-7 w-full rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-ring"
                placeholder="Contains..."
                value={filter?.kind === 'contains' ? filter.text : ''}
                onChange={(event) => {
                  const text = event.currentTarget.value;
                  onFilter(text ? { kind: 'contains', text } : undefined);
                }}
              />
            </div>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onFilter(undefined)}>
          <XIcon className="size-3.5" />
          Clear filter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getColumnValues(rows: SpreadsheetRow[], key: string) {
  const values = new Set<string>();
  for (const row of rows) {
    const value = row.values[key];
    if (value === undefined || value === null || value === '') continue;
    values.add(String(value));
  }
  return [...values].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export function SpreadsheetTable({
  tableId,
  rows,
  columns,
  loading,
  emptyTitle = 'No rows',
  emptyDescription = 'Create a row to start filling this table.',
  createLabel = 'New row',
  onCreateRow,
  autoEditCell,
  onAutoEditConsumed,
  showToolbar = true,
  query: queryProp,
  onQueryChange,
  filters: filtersProp,
  onFiltersChange,
  onUpdateCell,
  onOpenRow,
  onDeleteRow,
  onRowContextMenu,
  getRowAttributes,
  onAddColumn,
  addColumnLabel = 'Add field',
  variant = 'default',
}: SpreadsheetTableProps) {
  const embedded = variant === 'embedded';
  const presence = useBoardPresence();
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const cellTextSync = useCellTextSync(
    presence?.room ?? null,
    presence?.identity.peerId ?? '',
  );
  const { beginEdit: syncBeginEdit, applyLocalEdit, watchCell, releaseDoc, cellTexts } =
    cellTextSync;
  const watchCellRef = useRef(watchCell);
  watchCellRef.current = watchCell;
  const remoteWatchKey =
    presence?.enabled && presence.identity.peerId
      ? remoteFocusedCellSlotsKey(presence.focusByCell, presence.identity.peerId)
      : '';
  const surface = embedded ? 'bg-background' : 'bg-card';
  const rowSurface = embedded ? 'bg-background hover:bg-muted/55' : 'bg-card hover:bg-muted/55';
  // Sticky cells must stay fully opaque on hover so scrolled content does not bleed through.
  const stickyCellSurface = cn(surface, 'group-hover:bg-muted');
  const { widths, setColumnWidth, resetColumnWidth } = useColumnWidths(tableId);
  const [internalQuery, setInternalQuery] = useState('');
  const [internalFilters, setInternalFilters] = useState<Record<string, SpreadsheetColumnFilter>>({});
  const query = queryProp ?? internalQuery;
  const filters = filtersProp ?? internalFilters;

  const setQuery = useCallback(
    (value: string) => {
      if (onQueryChange) onQueryChange(value);
      else setInternalQuery(value);
    },
    [onQueryChange],
  );

  const setFilters = useCallback(
    (
      updater:
        | Record<string, SpreadsheetColumnFilter>
        | ((prev: Record<string, SpreadsheetColumnFilter>) => Record<string, SpreadsheetColumnFilter>),
    ) => {
      const next = typeof updater === 'function' ? updater(filters) : updater;
      if (onFiltersChange) onFiltersChange(next);
      else setInternalFilters(next);
    },
    [filters, onFiltersChange],
  );

  const [sort, setSort] = useState<SpreadsheetSort>({ key: null, dir: 'asc' });
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [lastSelected, setLastSelected] = useState('');
  const [editing, setEditing] = useState<EditingCell>(null);
  const [draft, setDraft] = useState('');
  const [cellEditError, setCellEditError] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, PendingCell>>({});
  const seq = useRef(0);
  const shiftClickRef = useRef(false);
  const applyingRemoteDraftRef = useRef(false);

  useEffect(() => {
    if (!presence?.enabled || !remoteWatchKey) return;

    const unsubs: Array<() => void> = [];
    for (const slot of remoteWatchKey.split('\u0001')) {
      if (!slot) continue;
      const [rowId, columnKey] = slot.split('\u0000');
      if (!rowId || !columnKey) continue;
      unsubs.push(watchCellRef.current(rowId, columnKey));
    }

    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, [presence?.enabled, remoteWatchKey]);

  useEffect(() => {
    if (!editing) return;
    const live = cellTexts[cellFocusKey(editing.rowId, editing.key)];
    if (live === undefined) return;

    setDraft((current) => {
      if (current === live) return current;
      const input = editInputRef.current;
      if (input && document.activeElement === input) {
        applyingRemoteDraftRef.current = true;
        applyRemoteFieldValue(input, live, current);
        applyingRemoteDraftRef.current = false;
      }
      return live;
    });
  }, [cellTexts, editing]);

  const idWidth = widths._id ?? DEFAULT_ID_WIDTH;
  const colWidth = useCallback(
    (column: SpreadsheetColumn) =>
      widths[column.key] ?? clampColumnWidth(column.width ?? DEFAULT_COL_WIDTH, column),
    [widths],
  );

  const columnWidths = useMemo(() => columns.map((column) => colWidth(column)), [colWidth, columns]);
  const addColumnWidth = onAddColumn ? ADD_COLUMN_WIDTH : 0;
  const gridTemplate = useMemo(
    () =>
      `${CHECK_WIDTH}px ${INDEX_WIDTH}px ${idWidth}px ${columns
        .map((column) => `${colWidth(column)}px`)
        .join(' ')}${onAddColumn ? ` ${ADD_COLUMN_WIDTH}px` : ''} ${ACTION_WIDTH}px`,
    [colWidth, columns, idWidth, onAddColumn],
  );
  const tableWidth = useMemo(
    () =>
      CHECK_WIDTH +
      INDEX_WIDTH +
      idWidth +
      addColumnWidth +
      ACTION_WIDTH +
      columnWidths.reduce((sum, width) => sum + width, 0),
    [addColumnWidth, columnWidths, idWidth],
  );

  const pendingValue = useCallback(
    (row: SpreadsheetRow, key: string) => pending[cellSlot(row.id, key)]?.value ?? row.values[key],
    [pending],
  );

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let next = rows.filter((row) => {
      if (q) {
        const found =
          row.id.toLowerCase().includes(q) ||
          columns.some((column) => searchableValue(pendingValue(row, column.key)).includes(q));
        if (!found) return false;
      }
      for (const [key, filter] of Object.entries(filters)) {
        if (!passesFilter(pendingValue(row, key), filter)) return false;
      }
      return true;
    });

    if (sort.key) {
      const dir = sort.dir === 'asc' ? 1 : -1;
      next = [...next].sort((a, b) => {
        const cmp = compareValues(pendingValue(a, sort.key!), pendingValue(b, sort.key!));
        if (cmp !== 0) return cmp * dir;
        return a.id.localeCompare(b.id);
      });
    }

    return next;
  }, [columns, filters, pendingValue, query, rows, sort.dir, sort.key]);

  const { ref: scrollerRef, measure, range } = useVirtualRows(filteredRows.length);
  const visibleRows = filteredRows.slice(range.start, range.end);
  const allSelected = filteredRows.length > 0 && filteredRows.every((row) => selected[row.id]);
  const selectedIds = filteredRows.filter((row) => selected[row.id]).map((row) => row.id);

  function setFilter(key: string, filter: SpreadsheetColumnFilter | undefined) {
    setFilters((prev) => {
      const next = { ...prev };
      if (filter) next[key] = filter;
      else delete next[key];
      return next;
    });
  }

  function cycleSort(key: string) {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return { key: null, dir: 'asc' };
    });
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? Object.fromEntries(filteredRows.map((row) => [row.id, true])) : {});
    setLastSelected('');
  }

  function toggleOne(rowId: string, checked: boolean, shift: boolean) {
    setSelected((prev) => {
      const next = { ...prev };
      const ids = filteredRows.map((row) => row.id);
      const start = ids.indexOf(lastSelected);
      const end = ids.indexOf(rowId);
      if (shift && start >= 0 && end >= 0) {
        for (const id of ids.slice(Math.min(start, end), Math.max(start, end) + 1)) {
          if (checked) next[id] = true;
          else delete next[id];
        }
      } else if (checked) {
        next[rowId] = true;
      } else {
        delete next[rowId];
      }
      return next;
    });
    setLastSelected(rowId);
  }

  function beginEdit(row: SpreadsheetRow, column: SpreadsheetColumn) {
    if (!isEditableTextColumn(column)) return;
    setCellEditError(null);
    const remoteHolders = presence?.enabled
      ? remoteCellFocusHolders(
          presence.focusByCell,
          row.id,
          column.key,
          presence.identity.peerId,
        )
      : [];
    setEditing({ rowId: row.id, key: column.key });
    const seed = displayDraft(pendingValue(row, column.key), column);
    const synced = syncBeginEdit(row.id, column.key, seed, {
      reset: remoteHolders.length === 0,
    });
    setDraft(synced);
    presence?.setCellFocus(row.id, column.key, 0, Date.now());
  }

  function clearEdit() {
    if (editing) {
      releaseDoc(editing.rowId, editing.key);
    }
    cancelCaretSync();
    setEditing(null);
    setDraft('');
    setCellEditError(null);
    presence?.setCellFocus(null, null, -1, 0);
  }

  // Open inline editing on a row that was just created (it streams in async, so
  // wait for the row + column to exist, then defer to the next frame so the row
  // is mounted before we focus its cell).
  useEffect(() => {
    if (!autoEditCell) return;
    const row = rows.find((candidate) => candidate.id === autoEditCell.rowId);
    const column = columns.find((candidate) => candidate.key === autoEditCell.key);
    if (!row || !column) return;
    const frame = requestAnimationFrame(() => {
      beginEdit(row, column);
      onAutoEditConsumed?.();
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire when the target row/column become available
  }, [autoEditCell, rows, columns]);

  const publishCellCaret = useCallback(
    (rowId: string, key: string, element: HTMLInputElement | HTMLTextAreaElement) => {
      scheduleCaretSync(() => {
        if (!isTextFieldActive(element)) {
          presence?.setCellFocus(rowId, key, -1, 0);
          return;
        }
        const caret = utf16ToCodePointIndex(element.value, element.selectionStart ?? 0);
        presence?.setCellFocus(rowId, key, caret, Date.now());
      });
    },
    [presence],
  );

  async function saveCell(rowId: string, key: string, value: unknown) {
    const token = ++seq.current;
    const slot = cellSlot(rowId, key);
    setPending((prev) => ({ ...prev, [slot]: { value, seq: token } }));
    try {
      await onUpdateCell(rowId, key, value);
    } catch (error) {
      setPending((prev) => {
        if (prev[slot]?.seq !== token) return prev;
        const next = { ...prev };
        delete next[slot];
        return next;
      });
      throw error;
    } finally {
      setPending((prev) => {
        if (prev[slot]?.seq !== token) return prev;
        const next = { ...prev };
        delete next[slot];
        return next;
      });
    }
  }

  async function commit(row: SpreadsheetRow, column: SpreadsheetColumn) {
    if (editing?.rowId !== row.id || editing.key !== column.key) return;
    try {
      await saveCell(row.id, column.key, castDraft(draft, column));
      clearEdit();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid value';
      setCellEditError(message);
    }
  }

  function editableColumnsFor(row: SpreadsheetRow) {
    return columns.filter((column) => isEditableTextColumn(column) && !column.readOnly && row.values);
  }

  function focusNext(row: SpreadsheetRow, column: SpreadsheetColumn, direction: 'next' | 'prev' | 'down') {
    const currentRows = filteredRows;
    const rowIndex = currentRows.findIndex((item) => item.id === row.id);
    if (rowIndex < 0) return;

    if (direction === 'down') {
      const nextRow = currentRows[rowIndex + 1];
      if (!nextRow || !isEditableTextColumn(column)) return;
      beginEdit(nextRow, column);
      const element = scrollerRef.current;
      if (element) {
        const y = (rowIndex + 1) * ROW_HEIGHT;
        if (y < element.scrollTop) element.scrollTop = y;
        if (y + ROW_HEIGHT > element.scrollTop + element.clientHeight) {
          element.scrollTop = y - element.clientHeight + ROW_HEIGHT;
        }
      }
      return;
    }

    const editable = editableColumnsFor(row);
    const columnIndex = editable.findIndex((item) => item.key === column.key);
    if (columnIndex < 0) return;
    const nextColumn = editable[direction === 'next' ? columnIndex + 1 : columnIndex - 1];
    if (nextColumn) beginEdit(row, nextColumn);
  }

  async function updateBoolean(row: SpreadsheetRow, column: SpreadsheetColumn) {
    presence?.setCellFocus(row.id, column.key);
    await saveCell(row.id, column.key, pendingValue(row, column.key) !== true);
  }

  async function updateSelect(row: SpreadsheetRow, column: SpreadsheetColumn, value: string) {
    presence?.setCellFocus(row.id, column.key);
    await saveCell(row.id, column.key, value || undefined);
  }

  async function updateSpecial(row: SpreadsheetRow, column: SpreadsheetColumn, value: unknown) {
    presence?.setCellFocus(row.id, column.key);
    await saveCell(row.id, column.key, value);
  }

  function copyId(rowId: string) {
    if (!navigator.clipboard) return;
    void navigator.clipboard.writeText(rowId);
  }

  return (
    <div
      className={cn(
        'flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden **:animate-none! **:transition-none!',
        embedded ? 'bg-background' : 'rounded-lg border border-border bg-card',
      )}
    >
      {showToolbar && (
        <div className="flex shrink-0 flex-col gap-2 border-b border-border px-3 py-2 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              className="h-8 w-full rounded-md border border-transparent bg-muted/40 pr-8 pl-8 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:bg-background"
              placeholder="Search table..."
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
            />
            {query && (
              <button
                type="button"
                className="absolute top-1/2 right-2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
            <span>
              {filteredRows.length}
              {filteredRows.length !== rows.length ? ` of ${rows.length}` : ''} rows
            </span>
            {onCreateRow && (
              <Button type="button" size="sm" className="gap-1" onClick={() => void onCreateRow()}>
                <PlusIcon className="size-3.5" />
                {createLabel}
              </Button>
            )}
          </div>
        </div>
      )}

      {showToolbar && Object.keys(filters).length > 0 && (
        <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border px-3 py-1.5 text-xs">
          {Object.entries(filters).map(([key, filter]) => {
            const column = columns.find((item) => item.key === key);
            return (
              <span
                key={key}
                className="inline-flex min-w-0 items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-primary"
              >
                <span className="text-muted-foreground">{column?.label ?? key}:</span>
                <span className="max-w-40 truncate font-medium">{spreadsheetFilterSummary(filter)}</span>
                <button
                  type="button"
                  className="rounded hover:bg-primary/15"
                  onClick={() => setFilter(key, undefined)}
                  aria-label={`Clear ${column?.label ?? key} filter`}
                >
                  <XIcon className="size-3" />
                </button>
              </span>
            );
          })}
          <button
            type="button"
            className="ml-1 rounded px-1.5 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => setFilters({})}
          >
            Clear all
          </button>
        </div>
      )}

      <BoardPresenceSurface className="min-h-0 flex-1 touch-auto">
      <div
        ref={scrollerRef}
        className={cn(
          'min-h-0 h-full flex-1 overflow-auto',
          embedded ? 'bg-background' : 'bg-muted/15',
        )}
        onScroll={(event) => measure(event.currentTarget)}
      >
        <div className="min-w-full" style={{ width: tableWidth }}>
          <div
            role="row"
            className={cn(
              'sticky top-0 z-40 grid h-9 border-b border-border text-[10px] font-medium tracking-wide text-muted-foreground uppercase',
              surface,
            )}
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <div className={cn('sticky left-0 z-40 flex items-center justify-center border-r border-border', surface)}>
              <Checkbox
                className="size-3.5 rounded-[3px]"
                checked={allSelected}
                onCheckedChange={(checked) => toggleAll(checked)}
                aria-label="Select all rows"
              />
            </div>
            <div
              className={cn('sticky z-40 flex items-center justify-center border-r border-border', surface)}
              style={{ left: CHECK_WIDTH }}
            >
              #
            </div>
            <div
              className={cn('sticky z-40 flex min-w-0 items-center gap-1 border-r border-border px-2', surface)}
              style={{ left: CHECK_WIDTH + INDEX_WIDTH }}
            >
              <span className="truncate">ID</span>
              <ColumnResizeHandle
                width={idWidth}
                onResize={(width) => setColumnWidth('_id', width)}
                onReset={() => resetColumnWidth('_id')}
              />
            </div>
            {columns.map((column, columnIndex) => {
              const width = colWidth(column);
              const activeSort = sort.key === column.key;
              const isLastDataColumn = columnIndex === columns.length - 1 && !onAddColumn;
              return (
                <div
                  key={column.key}
                  className={cn(
                    'relative flex min-w-0 items-center gap-1 px-2',
                    !isLastDataColumn && 'border-r border-border',
                  )}
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-1 truncate text-left hover:text-foreground"
                    onClick={() => cycleSort(column.key)}
                    title={`Sort by ${column.label}`}
                  >
                    {column.required && (
                      <span className="size-1.5 shrink-0 rounded-full bg-amber-500" title="Required" />
                    )}
                    <span className="truncate">{column.label}</span>
                    <SortIcon active={activeSort} dir={sort.dir} />
                  </button>
                  <ColumnFilterMenu
                    column={column}
                    filter={filters[column.key]}
                    values={column.options ?? getColumnValues(rows, column.key)}
                    onFilter={(filter) => setFilter(column.key, filter)}
                  />
                  <ColumnResizeHandle
                    width={width}
                    column={column}
                    onResize={(next) => setColumnWidth(column.key, next, column)}
                    onReset={() => resetColumnWidth(column.key)}
                  />
                </div>
              );
            })}
            {onAddColumn ? (
              <div className="flex min-w-0 items-center justify-center px-1">
                <button
                  type="button"
                  className="inline-flex min-w-0 items-center gap-1 rounded px-1.5 py-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase hover:bg-muted hover:text-foreground"
                  onClick={onAddColumn}
                  aria-label={addColumnLabel}
                  title={addColumnLabel}
                  data-testid="spreadsheet-add-column"
                >
                  <PlusIcon className="size-3 shrink-0" />
                  <span className="truncate">{addColumnLabel}</span>
                </button>
              </div>
            ) : null}
            <div className={cn('sticky right-0 z-40 flex items-center justify-center shadow-[-12px_0_18px_-20px_rgba(0,0,0,0.65)]', surface)}>
              <MoreHorizontalIcon className="size-3.5" />
            </div>
          </div>

          {loading ? (
            <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">Loading rows...</div>
          ) : filteredRows.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 px-6 text-center">
              <p className="text-sm font-medium">{query || Object.keys(filters).length ? 'No matching rows' : emptyTitle}</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {query || Object.keys(filters).length
                  ? 'Clear search or filters to widen the table.'
                  : emptyDescription}
              </p>
              {onCreateRow && !query && Object.keys(filters).length === 0 && (
                <Button type="button" size="sm" className="mt-2 gap-1" onClick={() => void onCreateRow()}>
                  <PlusIcon className="size-3.5" />
                  {createLabel}
                </Button>
              )}
            </div>
          ) : (
            <div className="relative" style={{ height: filteredRows.length * ROW_HEIGHT }}>
              {visibleRows.map((row, offset) => {
                const rowIndex = range.start + offset;
                const rowSelected = !!selected[row.id];
                const rowAttrs = getRowAttributes?.(row) ?? {};
                const rowHasRemoteCellFocus =
                  presence?.enabled &&
                  columns.some((column) => {
                    const holders = remoteCellFocusHolders(
                      presence.focusByCell,
                      row.id,
                      column.key,
                      presence.identity.peerId,
                    );
                    return holders.length > 0;
                  });
                return (
                  <div
                    key={row.id}
                    role="row"
                    {...rowAttrs}
                    className="group absolute right-0 left-0 border-b border-border/70"
                    style={{
                      top: rowIndex * ROW_HEIGHT,
                      height: ROW_HEIGHT,
                      zIndex: rowHasRemoteCellFocus ? 15 : undefined,
                    }}
                    onContextMenu={(event) => onRowContextMenu?.(event, row)}
                  >
                    <div
                      className={cn(
                        'grid h-full text-left text-xs',
                        rowSelected ? 'bg-muted text-foreground' : rowSurface,
                      )}
                      style={{ gridTemplateColumns: gridTemplate }}
                    >
                      <div
                        className={cn(
                          'sticky left-0 z-30 flex items-center justify-center border-r border-border',
                          rowSelected ? 'bg-muted' : stickyCellSurface,
                        )}
                      >
                        <Checkbox
                          className="size-3.5 rounded-[3px]"
                          checked={rowSelected}
                          onMouseDown={(event) => {
                            shiftClickRef.current = event.shiftKey;
                          }}
                          onCheckedChange={(checked) => {
                            toggleOne(row.id, checked, shiftClickRef.current);
                          }}
                          aria-label={`Select row ${rowIndex + 1}`}
                        />
                      </div>
                      <div
                        className={cn(
                          'sticky z-30 flex items-center justify-center border-r border-border font-mono text-[10px] text-muted-foreground',
                          rowSelected ? 'bg-muted' : stickyCellSurface,
                        )}
                        style={{ left: CHECK_WIDTH }}
                      >
                        {rowIndex + 1}
                      </div>
                      <div
                        className={cn(
                          'sticky z-30 flex min-w-0 items-center gap-1 border-r border-border',
                          rowSelected ? 'bg-muted' : stickyCellSurface,
                          onOpenRow && 'cursor-pointer',
                        )}
                        style={{ left: CHECK_WIDTH + INDEX_WIDTH }}
                        onDoubleClick={() => onOpenRow?.(row)}
                        title={onOpenRow ? 'Double-click to open record' : undefined}
                      >
                        <span className="min-w-0 flex-1 truncate pl-2 font-mono text-[10px] text-muted-foreground">
                          {row.id}
                        </span>
                        <button
                          type="button"
                          className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 hover:bg-background hover:text-foreground group-hover:opacity-100 focus:opacity-100"
                          onClick={() => copyId(row.id)}
                          aria-label={`Copy ${row.id}`}
                          title="Copy ID"
                        >
                          <CopyIcon className="size-3" />
                        </button>
                      </div>
                      {columns.map((column, columnIndex) => {
                        const value = pendingValue(row, column.key);
                        const active = editing?.rowId === row.id && editing.key === column.key;
                        const kind = column.kind ?? 'text';
                        const missing = column.required && isEmpty(value);
                        const isLastDataColumn = columnIndex === columns.length - 1 && !onAddColumn;
                        const remoteHolders = presence?.enabled
                          ? remoteCellFocusHolders(
                              presence.focusByCell,
                              row.id,
                              column.key,
                              presence.identity.peerId,
                            )
                          : [];
                        const remoteFocusColor = remoteHolders[0]?.color;
                        const showRemoteCarets =
                          (kind === 'text' || kind === 'longtext') && remoteHolders.length > 0;
                        const liveCellText =
                          (remoteHolders.length > 0
                            ? cellTexts[cellFocusKey(row.id, column.key)]
                            : undefined) ??
                          (active ? draft : labelValue(value, column));
                        const caretMirrorClass =
                          'h-full w-full min-w-0 rounded-none px-2 text-xs';
                        return (
                          <div
                            key={column.key}
                            role="gridcell"
                            className={cn(
                              'relative flex min-w-0 h-full',
                              remoteHolders.length > 0 ? 'z-20 overflow-visible' : 'overflow-hidden',
                              !isLastDataColumn && 'border-r border-border',
                              kind === 'boolean' ? 'items-center justify-center' : 'items-stretch',
                              missing && 'ring-1 ring-inset ring-amber-500/45',
                              active && 'z-10 border border-primary bg-primary/5',
                            )}
                            style={
                              remoteFocusColor
                                ? { boxShadow: `inset 0 0 0 2px ${remoteFocusColor}` }
                                : undefined
                            }
                            title={remoteHolders.map((holder) => holder.name).join(', ') || undefined}
                            onDoubleClick={() => beginEdit(row, column)}
                          >
                            {remoteHolders.length > 0 ? (
                              <RemoteCellNameBadges holders={remoteHolders} />
                            ) : null}
                            {kind === 'boolean' ? (
                              <button
                                type="button"
                                role="switch"
                                aria-checked={value === true}
                                className={cn(
                                  'relative inline-flex h-4 w-7 shrink-0 rounded-full',
                                  value === true ? 'bg-primary' : 'bg-muted ring-1 ring-inset ring-border',
                                )}
                                onClick={() => void updateBoolean(row, column)}
                              >
                                <span
                                  className={cn(
                                    'absolute top-0.5 h-3 w-3 rounded-full bg-background shadow-sm',
                                    value === true ? 'translate-x-3.5' : 'translate-x-0.5',
                                  )}
                                />
                              </button>
                            ) : kind === 'select' ? (
                              <Select
                                value={value == null ? SELECT_EMPTY_VALUE : String(value)}
                                onValueChange={(next) =>
                                  void updateSelect(
                                    row,
                                    column,
                                    next === SELECT_EMPTY_VALUE ? '' : next,
                                  )
                                }
                              >
                                <SelectTrigger
                                  size="sm"
                                  className="h-full w-full min-w-0 rounded-none border-0 bg-transparent px-2 shadow-none hover:bg-muted focus:ring-0"
                                  onFocus={() => presence?.setCellFocus(row.id, column.key)}
                                >
                                  <SelectValue placeholder="-" />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                  <SelectItem value={SELECT_EMPTY_VALUE}>-</SelectItem>
                                  {(column.options ?? []).map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : kind === 'date' ? (
                              <DatePicker
                                compact
                                value={value}
                                placeholder="—"
                                onChange={(next) => void updateSpecial(row, column, next)}
                              />
                            ) : kind === 'color' ? (
                              <ColorFieldControl
                                compact
                                value={value}
                                onChange={(next) => void updateSpecial(row, column, next)}
                              />
                            ) : kind === 'icon' ? (
                              <IconFieldControl
                                compact
                                value={value}
                                onChange={(next) => void updateSpecial(row, column, next)}
                              />
                            ) : active ? (
                              <div className="relative flex h-full w-full min-w-0 flex-col">
                                <input
                                  ref={editInputRef}
                                  type={
                                    kind === 'number'
                                      ? 'number'
                                      : column.valueType === 'email'
                                        ? 'email'
                                        : column.valueType === 'phone_number'
                                          ? 'tel'
                                          : column.valueType === 'url'
                                            ? 'url'
                                            : 'text'
                                  }
                                  min={kind === 'number' ? column.min : undefined}
                                  max={kind === 'number' ? column.max : undefined}
                                  step={
                                    kind === 'number'
                                      ? column.step ?? (column.format === 'currency' ? 0.01 : 'any')
                                      : undefined
                                  }
                                  maxLength={column.maxLength}
                                  autoFocus
                                  aria-invalid={Boolean(cellEditError)}
                                  className={cn(
                                    'h-full w-full min-w-0 rounded-none border-0 bg-transparent px-2 text-xs shadow-none outline-none focus-visible:ring-0',
                                    cellEditError && 'text-destructive',
                                  )}
                                  value={draft}
                                  onChange={(event) => {
                                    if (applyingRemoteDraftRef.current) return;
                                    setCellEditError(null);
                                    const next = event.currentTarget.value;
                                    applyLocalEdit(row.id, column.key, next);
                                    setDraft(next);
                                    publishCellCaret(row.id, column.key, event.currentTarget);
                                  }}
                                  onFocus={(event) =>
                                    publishCellCaret(row.id, column.key, event.currentTarget)
                                  }
                                  onSelect={(event) =>
                                    publishCellCaret(row.id, column.key, event.currentTarget)
                                  }
                                  onKeyUp={(event) =>
                                    publishCellCaret(row.id, column.key, event.currentTarget)
                                  }
                                  onClick={(event) =>
                                    publishCellCaret(row.id, column.key, event.currentTarget)
                                  }
                                  onBlur={() => {
                                    cancelCaretSync();
                                    presence?.setCellFocus(row.id, column.key, -1, 0);
                                    void commit(row, column);
                                  }}
                                  onKeyDown={(event) => {
                                    publishCellCaret(row.id, column.key, event.currentTarget);
                                    if (event.key === 'Escape') {
                                      event.preventDefault();
                                      clearEdit();
                                      return;
                                    }
                                    if (event.key === 'Tab') {
                                      event.preventDefault();
                                      const direction = event.shiftKey ? 'prev' : 'next';
                                      void commit(row, column).then(() => focusNext(row, column, direction));
                                      return;
                                    }
                                    if (event.key === 'Enter') {
                                      event.preventDefault();
                                      void commit(row, column).then(() => focusNext(row, column, 'down'));
                                    }
                                  }}
                                />
                                {showRemoteCarets ? (
                                  <MeasuredRemoteCarets
                                    holders={remoteHolders}
                                    text={liveCellText}
                                    mirrorClassName={caretMirrorClass}
                                  />
                                ) : null}
                                {cellEditError ? (
                                  <span
                                    className="pointer-events-none absolute bottom-0 left-2 right-2 truncate text-[10px] text-destructive"
                                    title={cellEditError}
                                  >
                                    {cellEditError}
                                  </span>
                                ) : null}
                              </div>
                            ) : (
                              <button
                                type="button"
                                className={cn(
                                  'relative h-full w-full min-w-0 truncate rounded-none px-2 text-left text-xs hover:bg-muted',
                                  (kind === 'formula' || kind === 'reference' || kind === 'readonly' || column.readOnly) &&
                                    'cursor-default text-muted-foreground hover:bg-transparent',
                                  isEmpty(value) && !liveCellText && 'text-muted-foreground',
                                )}
                                onClick={() => beginEdit(row, column)}
                                title={liveCellText}
                              >
                                {showRemoteCarets ? (
                                  <MeasuredRemoteCarets
                                    holders={remoteHolders}
                                    text={liveCellText}
                                    mirrorClassName={cn(caretMirrorClass, 'text-left')}
                                  />
                                ) : null}
                                {kind === 'formula' && <span className="mr-1 text-muted-foreground">fx</span>}
                                {liveCellText}
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {onAddColumn ? (
                        <div className="bg-inherit" aria-hidden />
                      ) : null}
                      <div
                        className={cn(
                          'sticky right-0 z-30 flex items-center justify-center shadow-[-12px_0_18px_-20px_rgba(0,0,0,0.65)]',
                          rowSelected ? 'bg-muted' : stickyCellSurface,
                        )}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <button
                                type="button"
                                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
                                aria-label={`Actions for row ${rowIndex + 1}`}
                              >
                                <MoreHorizontalIcon className="size-3.5" />
                              </button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem onClick={() => copyId(row.id)}>
                              <CopyIcon className="size-3.5" />
                              Copy ID
                            </DropdownMenuItem>
                            {onDeleteRow && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" onClick={() => void onDeleteRow(row.id)}>
                                  <Trash2Icon className="size-3.5" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {onCreateRow && filteredRows.length > 0 && !loading && (
            <button
              type="button"
              className={cn(
                'sticky bottom-0 z-40 flex h-11 w-full items-center border-t border-border px-4 text-left text-xs font-medium text-muted-foreground hover:text-foreground',
                surface,
              )}
              onClick={() => void onCreateRow()}
            >
              <span className="sticky left-4 inline-flex items-center gap-2">
                <PlusIcon className="size-3.5" />
                {createLabel}
              </span>
            </button>
          )}
        </div>
      </div>
      </BoardPresenceSurface>

      {selectedIds.length > 0 && (
        <div className={cn('shrink-0 border-t border-border px-3 py-2', surface)}>
          <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-muted/35 px-2 py-1.5 text-xs">
            <span className="mr-1 font-medium">{selectedIds.length} selected</span>
            {onDeleteRow && (
              <Button
                type="button"
                size="xs"
                variant="destructive"
                className="gap-1"
                onClick={() => {
                  for (const id of selectedIds) void onDeleteRow(id);
                  setSelected({});
                }}
              >
                <Trash2Icon className="size-3" />
                Delete
              </Button>
            )}
            <Button type="button" size="xs" variant="ghost" className="ml-auto" onClick={() => setSelected({})}>
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
