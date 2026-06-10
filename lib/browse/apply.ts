import type { BrowseConfig, BrowseSortDir } from '../registry/browse-config';

export type BrowseState = {
  query: string;
  sortKey: string;
  sortDir: BrowseSortDir;
};

export function defaultBrowseState<E>(config: BrowseConfig<E>): BrowseState {
  return {
    query: '',
    sortKey: String(config.defaultSort),
    sortDir: config.defaultDir ?? 'desc',
  };
}

function fieldValue(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  if (value == null) return '';
  return String(value).toLowerCase();
}

export function compareBrowseValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);

  const aDate = Date.parse(String(a));
  const bDate = Date.parse(String(b));
  if (!Number.isNaN(aDate) && !Number.isNaN(bDate)) return aDate - bDate;

  return String(a).localeCompare(String(b), undefined, { sensitivity: 'base' });
}

function searchKeysFor<E>(config: BrowseConfig<E>): string[] {
  return config.searchKeys?.length
    ? config.searchKeys.map(String)
    : config.fields.filter((f) => f.searchable).map((f) => String(f.key));
}

/** Client-side search slice only — for kanban (per-lane sort happens in reconcile). */
export function applyCollectionFilter<E extends Record<string, unknown>>(
  rows: E[],
  state: BrowseState,
  config: BrowseConfig<E>,
): E[] {
  const query = state.query.trim().toLowerCase();
  if (!query) return rows;

  const searchKeys = searchKeysFor(config);
  return rows.filter((row) =>
    searchKeys.some((key) => fieldValue(row, key).includes(query)),
  );
}

/** Client-side filter + sort slice — sits above reconcile, below graph ingress. */
export function applyCollectionBrowse<E extends Record<string, unknown>>(
  rows: E[],
  state: BrowseState,
  config: BrowseConfig<E>,
): E[] {
  const filtered = applyCollectionFilter(rows, state, config);
  const sortKey = state.sortKey;
  const dir = state.sortDir === 'asc' ? 1 : -1;

  return [...filtered].sort((a, b) => {
    const cmp = compareBrowseValues(a[sortKey], b[sortKey]);
    if (cmp !== 0) return cmp * dir;
    return String(b.id ?? '').localeCompare(String(a.id ?? ''));
  });
}
