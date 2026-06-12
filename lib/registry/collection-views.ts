import type { AnyType } from 'trellis/schema';
import { inferFieldSignalsFromDefinition } from './infer-from-definition';
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
  | 'card-grid'
  | 'dag'
  | 'json-ld';

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
  /** At least one signal must be present (e.g. kanban = select). */
  requireAny?: FieldSignal[];
};

type TypeDefinitionLike = {
  fields?: { name: string; valueType?: string }[];
};

/** Subset of trellis-client PROJECTION_NODES with playground-relevant gates. */
const COLLECTION_VIEW_NODES: ProjectionNode[] = [
  { mode: 'table', label: 'Table', order: 1 },
  { mode: 'kanban', label: 'Kanban', order: 2, requireAny: ['select'] },
  { mode: 'calendar', label: 'Calendar', order: 3, requireAny: ['date'] },
  { mode: 'gantt', label: 'Gantt', order: 4, requireAll: ['date', 'lane'] },
  { mode: 'list', label: 'List', order: 5 },
  { mode: 'card-grid', label: 'Grid', order: 6 },
  { mode: 'json-ld', label: 'JSON-LD', order: 7 },
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

function suggestDefaultFromSignals(signals: Set<FieldSignal>): CollectionViewMode {
  if (signals.has('date') && signals.has('lane')) return 'gantt';
  if (signals.has('select')) return 'kanban';
  if (signals.has('date')) return 'calendar';
  return 'table';
}

function buildCollectionViewOptions(signals: Set<FieldSignal>): CollectionViewOption[] {
  const defaultMode = suggestDefaultFromSignals(signals);

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

/**
 * Suggest the best default collection view for a Trellis type.
 * Mirrors trellis-client `suggestDefaultProjection()` over Zod shapes.
 */
export function suggestDefaultCollectionView(type: AnyType): CollectionViewMode {
  return suggestDefaultFromSignals(inferFieldSignals(type));
}

/** Suggest default view from a server type definition. */
export function suggestDefaultCollectionViewFromDefinition(
  def: TypeDefinitionLike,
): CollectionViewMode {
  return suggestDefaultFromSignals(inferFieldSignalsFromDefinition(def));
}

/** Eligible collection views for a type — type gate above motion layer. */
export function suggestCollectionViews(type: AnyType): CollectionViewOption[] {
  return buildCollectionViewOptions(inferFieldSignals(type));
}

/** Eligible collection views from a server type definition. */
export function suggestCollectionViewsFromDefinition(
  def: TypeDefinitionLike,
): CollectionViewOption[] {
  return buildCollectionViewOptions(inferFieldSignalsFromDefinition(def));
}

/** Modes that pass the type gate (for view pickers). */
export function eligibleCollectionViews(type: AnyType): CollectionViewOption[] {
  return suggestCollectionViews(type).filter((option) => option.supported);
}

/** Modes that pass the type gate from a server type definition. */
export function eligibleCollectionViewsFromDefinition(
  def: TypeDefinitionLike,
): CollectionViewOption[] {
  return suggestCollectionViewsFromDefinition(def).filter((option) => option.supported);
}
