import type { AnyType } from 'trellis/schema';
import { inferFieldSignals, type FieldSignal } from './introspect';

/**
 * Playground collection views — aligned with trellis-client `BrowseViewMode` where
 * proofs exist. `card-grid` maps to playground surface grid (`LayoutId` / `#cards`).
 */
export type CollectionViewMode =
  | 'table'
  | 'kanban'
  | 'calendar'
  | 'gantt'
  | 'list'
  | 'card-grid';

export type CollectionViewOption = {
  mode: CollectionViewMode;
  label: string;
  supported: boolean;
  isDefault: boolean;
  reason?: string;
};

type ProjectionNode = {
  mode: CollectionViewMode;
  label: string;
  order: number;
  /** All listed signals must be present (e.g. gantt = date + lane). */
  requireAll?: FieldSignal[];
  /** At least one signal must be present (e.g. card-grid = file | url). */
  requireAny?: FieldSignal[];
};

/** Subset of trellis-client PROJECTION_NODES with playground-relevant gates. */
const COLLECTION_VIEW_NODES: ProjectionNode[] = [
  { mode: 'table', label: 'Table', order: 1 },
  { mode: 'kanban', label: 'Kanban', order: 2, requireAny: ['select'] },
  { mode: 'calendar', label: 'Calendar', order: 3, requireAny: ['date'] },
  { mode: 'gantt', label: 'Gantt', order: 4, requireAll: ['date', 'lane'] },
  { mode: 'list', label: 'List', order: 5 },
  { mode: 'card-grid', label: 'Card grid', order: 6, requireAny: ['file', 'url'] },
];

function evaluateNode(node: ProjectionNode, signals: Set<FieldSignal>): { supported: boolean; reason?: string } {
  if (node.requireAll?.length) {
    const missing = node.requireAll.filter((signal) => !signals.has(signal));
    if (missing.length) {
      return {
        supported: false,
        reason: `Needs ${missing.join(' + ')} fields`,
      };
    }
    return { supported: true };
  }

  if (node.requireAny?.length) {
    const matched = node.requireAny.some((signal) => signals.has(signal));
    if (!matched) {
      return {
        supported: false,
        reason: `Needs ${node.requireAny.join(' or ')} field`,
      };
    }
    return { supported: true };
  }

  return { supported: true };
}

/**
 * Suggest the best default collection view for a Trellis type.
 * Mirrors trellis-client `suggestDefaultProjection()` over Zod shapes.
 */
export function suggestDefaultCollectionView(type: AnyType): CollectionViewMode {
  const signals = inferFieldSignals(type);
  if (signals.has('date') && signals.has('lane')) return 'gantt';
  if (signals.has('select')) return 'kanban';
  if (signals.has('date')) return 'calendar';
  if (signals.has('file') || signals.has('url')) return 'card-grid';
  return 'table';
}

/** Eligible collection views for a type — ontology gate above motion layer. */
export function suggestCollectionViews(type: AnyType): CollectionViewOption[] {
  const signals = inferFieldSignals(type);
  const defaultMode = suggestDefaultCollectionView(type);

  return COLLECTION_VIEW_NODES.map((node) => {
    const { supported, reason } = evaluateNode(node, signals);
    return {
      mode: node.mode,
      label: node.label,
      supported,
      isDefault: supported && node.mode === defaultMode,
      reason,
    };
  }).sort((a, b) => {
    const orderA = COLLECTION_VIEW_NODES.find((n) => n.mode === a.mode)?.order ?? 0;
    const orderB = COLLECTION_VIEW_NODES.find((n) => n.mode === b.mode)?.order ?? 0;
    return orderA - orderB;
  });
}

/** Modes that pass the ontology gate (for view pickers). */
export function eligibleCollectionViews(type: AnyType): CollectionViewOption[] {
  return suggestCollectionViews(type).filter((option) => option.supported);
}
