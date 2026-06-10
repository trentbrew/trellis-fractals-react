import type { AnyType } from 'trellis/schema';
import type { CollectionViewMode } from './collection-views';
import { suggestCollectionViews } from './collection-views';
import { corpusCollectionHref, getCorpusType } from './corpus-registry';

/** Playground demo routes for collection views that have motion proofs. */
export const COLLECTION_VIEW_ROUTES: Partial<Record<CollectionViewMode, string>> = {
  list: '/todos',
  table: '/table',
  kanban: '/kanban',
  calendar: '/calendar',
  gantt: '/gantt',
  'card-grid': '/grid',
};

export function viewDemoHref(mode: CollectionViewMode): string | undefined {
  return COLLECTION_VIEW_ROUTES[mode];
}

/** Type-aware collection host href; falls back to legacy view routes for non-corpus schemas. */
export function corpusViewHref(
  schema: AnyType,
  targetView: CollectionViewMode,
): string | undefined {
  const entry = getCorpusType(schema.type);
  if (!entry) return viewDemoHref(targetView);

  const option = suggestCollectionViews(schema).find((v) => v.mode === targetView);
  if (!option?.supported) return undefined;

  return corpusCollectionHref(entry.typeName, targetView);
}
