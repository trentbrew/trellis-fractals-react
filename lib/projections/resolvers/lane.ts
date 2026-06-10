import { compareBrowseValues, type BrowseState } from '../../browse/apply';
import type { BrowseConfig } from '../../registry/browse-config';
import { sortNewestFirst } from '../sort';
import type { KanbanCardT, KanbanStatus } from '../../schemas/kanban-card';

export type LaneDef = {
  id: KanbanStatus;
  label: string;
};

export const DEFAULT_KANBAN_LANES: LaneDef[] = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'doing', label: 'In progress' },
  { id: 'done', label: 'Done' },
];

export type LaneBrowseSort = {
  state: BrowseState;
  config: BrowseConfig<KanbanCardT>;
};

const sortLaneSubset = (laneRows: KanbanCardT[], browse: LaneBrowseSort) => {
  const { state } = browse;
  const sortKey = state.sortKey;
  const dir = state.sortDir === 'asc' ? 1 : -1;

  return [...laneRows].sort((a, b) => {
    const cmp = compareBrowseValues(
      (a as Record<string, unknown>)[sortKey],
      (b as Record<string, unknown>)[sortKey],
    );
    if (cmp !== 0) return cmp * dir;
    return String(b.id ?? '').localeCompare(String(a.id ?? ''));
  });
};

/** Per-lane sort: groups rows by `status`, sorts within each lane (kanban browse policy). */
export const sortLaneCards = (rows: KanbanCardT[], browse?: LaneBrowseSort) => {
  if (!browse) return sortNewestFirst(rows);

  return DEFAULT_KANBAN_LANES.flatMap((lane) =>
    sortLaneSubset(
      rows.filter((card) => card.status === lane.id),
      browse,
    ),
  );
};

/** Group sorted rows by lane id — `bucket(entity) => entity.status`. */
export const groupByLane = (rows: KanbanCardT[]): Record<KanbanStatus, KanbanCardT[]> => {
  const groups = Object.fromEntries(
    DEFAULT_KANBAN_LANES.map((lane) => [lane.id, [] as KanbanCardT[]]),
  ) as Record<KanbanStatus, KanbanCardT[]>;

  for (const row of rows) {
    groups[row.status]?.push(row);
  }

  return groups;
};
