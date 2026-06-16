import type { AnyType } from 'trellis/schema';
import { Card } from '../schemas/card';
import { CalendarEvent } from '../schemas/calendar-event';
import { GanttTask } from '../schemas/gantt-task';
import { KanbanCard } from '../schemas/kanban-card';
import { Task } from '../schemas/task';
import { suggestCollectionViews, type CollectionViewMode } from './collection-views';

/**
 * Projection-fixture schemas for the /projections dev lab.
 * Not collection nav — seeded by scripts/seed-projection-fixtures.mjs.
 */
export type CorpusTypeName =
  | 'Card'
  | 'KanbanCard'
  | 'CalendarEvent'
  | 'GanttTask'
  | 'Task';

export type CorpusTypeEntry = {
  typeName: CorpusTypeName;
  schema: AnyType;
  label: string;
  /** Matches suggestDefaultCollectionView(schema) — see inline comments per entry */
  defaultView: CollectionViewMode;
  /** Direct route under /projections for this type's default view */
  route: string;
  /** Projections secondary sidebar label (view name, not entity type). */
  demoLabel?: string;
  /** Projections secondary sidebar active id */
  demoId: string;
};

export const CORPUS_TYPES: Record<CorpusTypeName, CorpusTypeEntry> = {
  Card: {
    typeName: 'Card',
    schema: Card,
    label: 'Cards',
    demoLabel: 'Table',
    defaultView: 'table', // no select/date/file/url → table
    route: '/projections/table',
    demoId: 'table',
  },
  KanbanCard: {
    typeName: 'KanbanCard',
    schema: KanbanCard,
    label: 'Kanban',
    defaultView: 'kanban', // select field → kanban
    route: '/projections/kanban',
    demoId: 'kanban',
  },
  CalendarEvent: {
    typeName: 'CalendarEvent',
    schema: CalendarEvent,
    label: 'Calendar',
    defaultView: 'calendar', // date field → calendar
    route: '/projections/calendar',
    demoId: 'calendar',
  },
  GanttTask: {
    typeName: 'GanttTask',
    schema: GanttTask,
    label: 'Gantt',
    defaultView: 'gantt', // date + lane → gantt
    route: '/projections/gantt',
    demoId: 'gantt',
  },
  Task: {
    typeName: 'Task',
    schema: Task,
    label: 'Todos',
    defaultView: 'list', // plain fields → list
    route: '/projections/list',
    demoId: 'todos',
  },
};

const COLLECTION_HOST = '/collection';

export function listCorpusTypes(): CorpusTypeEntry[] {
  return Object.values(CORPUS_TYPES);
}

export function getCorpusType(name: string): CorpusTypeEntry | undefined {
  return CORPUS_TYPES[name as CorpusTypeName];
}

export function corpusCollectionHref(
  typeName: CorpusTypeName,
  view?: CollectionViewMode,
): string {
  const entry = CORPUS_TYPES[typeName];
  const resolvedView = view ?? entry.defaultView;
  const params = new URLSearchParams({ type: typeName });
  if (resolvedView !== entry.defaultView) {
    params.set('view', resolvedView);
  }
  return `${COLLECTION_HOST}?${params.toString()}`;
}

export function resolveCollectionMount(
  typeName: CorpusTypeName,
  view: CollectionViewMode,
): { supported: boolean; reason?: string } {
  const entry = CORPUS_TYPES[typeName];
  const option = suggestCollectionViews(entry.schema).find((v) => v.mode === view);
  if (!option) return { supported: false, reason: 'Unknown view mode' };
  if (!option.supported) return { supported: false, reason: option.reason };
  // Collection host mounts one proof board per corpus type (its default view).
  if (view !== entry.defaultView) {
    return {
      supported: false,
      reason: `${entry.label} is mounted as ${entry.defaultView} — open ${entry.route}`,
    };
  }
  return { supported: true };
}

/** Views the collection host can mount for a corpus type (type ∩ proof boards). */
export function mountedCollectionViews(typeName: CorpusTypeName): CollectionViewMode[] {
  const entry = CORPUS_TYPES[typeName];
  const mount = resolveCollectionMount(typeName, entry.defaultView);
  return mount.supported ? [entry.defaultView] : [];
}
