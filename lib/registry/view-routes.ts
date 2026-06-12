import type { AnyType } from 'trellis/schema';
import type { CollectionViewMode } from './collection-views';
import {
  corpusCollectionHref,
  getCorpusType,
  resolveCollectionMount,
  type CorpusTypeName,
} from './corpus-registry';

/** Projection lab routes for collection views with proof boards. */
export const COLLECTION_VIEW_ROUTES: Partial<Record<CollectionViewMode, string>> = {
  list: '/projections/list',
  table: '/projections/table',
  kanban: '/projections/kanban',
  calendar: '/projections/calendar',
  gantt: '/projections/gantt',
  'card-grid': '/grid',
  dag: '/projections/dag',
  'json-ld': '/projections/json-ld',
};

export function viewDemoHref(mode: CollectionViewMode): string | undefined {
  return COLLECTION_VIEW_ROUTES[mode];
}

/** Type-aware href for view switcher — corpus types use collection host or direct demo route. */
export function corpusViewHref(
  schema: AnyType,
  targetView: CollectionViewMode,
): string | undefined {
  const entry = getCorpusType(schema.type);
  if (!entry) return viewDemoHref(targetView);

  if (targetView === entry.defaultView) {
    return entry.route;
  }

  const mount = resolveCollectionMount(entry.typeName, targetView);
  if (!mount.supported) return undefined;

  return corpusCollectionHref(entry.typeName, targetView);
}

export function resolveCorpusCollectionMount(typeName: CorpusTypeName, view: CollectionViewMode) {
  return resolveCollectionMount(typeName, view);
}
