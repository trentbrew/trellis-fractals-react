export type FractalShell = 'node' | 'row' | 'card';

export type FractalBoardProjection = 'graph' | 'list' | 'grid';

export const VANTAGE_MIN = 1;
export const VANTAGE_MAX = 12;
export const DEFAULT_VANTAGE = 10;

/** Graph projection band — dot field (v1–2). */
export const GRAPH_VANTAGE_MAX = 2;

/** List projection band — row shell (v3–6). */
export const LIST_VANTAGE_MIN = 3;
export const LIST_VANTAGE_MAX = 6;

/** Grid starts at v7; variants step from visual-first tiles to hero panels. */
export const GRID_VANTAGE_MIN = 7;
export const DENSE_GRID_VANTAGE_MAX = 8;

export type GridCardVariant = 'tile' | 'compact' | 'card' | 'panel';

export type ListRowMetrics = {
  minHeight: string;
  paddingBlock: string;
  paddingInline: string;
  gap: string;
  thumbSize: string;
};

export function resolveShell(vantage: number): FractalShell {
  if (vantage <= 4) return 'node';
  if (vantage <= LIST_VANTAGE_MAX) return 'row';
  return 'card';
}

export function resolveBoardProjection(vantage: number): FractalBoardProjection {
  if (vantage <= GRAPH_VANTAGE_MAX) return 'graph';
  if (vantage <= LIST_VANTAGE_MAX) return 'list';
  return 'grid';
}

export type GraphListCrossfade = {
  graph: number;
  list: number;
};

/**
 * Dual-shell opacity for the graph ↔ list boundary (v2 → v3).
 * Both layers stay mounted between integer bands so the slider crossfades
 * instead of swapping projections.
 */
export function resolveGraphListCrossfade(vantage: number): GraphListCrossfade {
  if (vantage <= GRAPH_VANTAGE_MAX) return { graph: 1, list: 0 };
  if (vantage >= LIST_VANTAGE_MIN) return { graph: 0, list: 1 };
  const t = vantage - GRAPH_VANTAGE_MAX;
  return { graph: 1 - t, list: t };
}

/** Row density for list projection — grows from compact (v3) to rich (v7). */
export function resolveListRowMetrics(vantage: number): ListRowMetrics {
  const span = LIST_VANTAGE_MAX - LIST_VANTAGE_MIN;
  const t = span <= 0 ? 0 : Math.max(0, Math.min(1, (vantage - LIST_VANTAGE_MIN) / span));
  return {
    minHeight: `${3.25 + t * 1.75}rem`,
    paddingBlock: `${0.375 + t * 0.375}rem`,
    paddingInline: `${0.75 + t * 0.25}rem`,
    gap: `${0.625 + t * 0.375}rem`,
    thumbSize: `${0.75 + t * 1.75}rem`,
  };
}

/** Absolute column ceiling on the widest containers. */
export const GRID_COL_MAX = 6;

/** Width breakpoints for responsive column caps (compact cards at v7). */
export const GRID_COL_WIDTH_BREAKPOINTS = [
  { minWidth: 1200, cols: 6 },
  { minWidth: 1000, cols: 5 },
  { minWidth: 800, cols: 4 },
  { minWidth: 640, cols: 3 },
  { minWidth: 480, cols: 2 },
] as const;

/** Spatial ceiling from measured width — independent of vantage preference. */
export function maxColsForWidth(containerWidthPx: number): number {
  if (containerWidthPx <= 0) return 1;
  for (const breakpoint of GRID_COL_WIDTH_BREAKPOINTS) {
    if (containerWidthPx >= breakpoint.minWidth) return breakpoint.cols;
  }
  return 1;
}

/** Preferred columns shrink as card shells grow from compact tiles to hero panels. */
function resolveGridColumnsFromVantage(vantage: number): number {
  if (vantage >= 12) return 1;
  if (vantage >= 11) return 2;
  if (vantage >= 10) return 3;
  if (vantage >= 9) return 4;
  if (vantage >= 8) return 5;
  return 6;
}

/** Grid card shells — compact (left thumb) → tile (immersive) → card → panel. */
export function resolveGridCardVariant(vantage: number): GridCardVariant {
  if (vantage <= 7) return 'compact';
  if (vantage <= 8) return 'tile';
  if (vantage <= 10) return 'card';
  return 'panel';
}

/** @deprecated Use resolveGridCardVariant */
export function resolveGridCardDensity(vantage: number): 'compact' | 'comfortable' {
  const variant = resolveGridCardVariant(vantage);
  return variant === 'tile' || variant === 'compact' ? 'compact' : 'comfortable';
}

export function resolveGridGapClass(vantage: number): string {
  const variant = resolveGridCardVariant(vantage);
  if (variant === 'compact' || variant === 'tile') return 'gap-2';
  return 'gap-4';
}

/**
 * Preferred columns from vantage, capped by container width when measured.
 * Omit width for vantage-only resolution (SSR / tests).
 */
export function resolveGridColumns(vantage: number, containerWidthPx?: number): number {
  const preferred = resolveGridColumnsFromVantage(vantage);
  if (containerWidthPx == null || containerWidthPx <= 0) return preferred;
  return Math.min(preferred, maxColsForWidth(containerWidthPx));
}

export function detailOpacity(vantage: number, threshold: number, slope: number) {
  return Math.max(0, Math.min(1, (vantage - threshold) * slope));
}

export function parseVantageParam(value: string | null | undefined): number | undefined {
  if (value == null || value === '') return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(VANTAGE_MAX, Math.max(VANTAGE_MIN, n));
}

export function parseVantageFromSearch(search = ''): number | undefined {
  const raw = search.startsWith('?') ? search.slice(1) : search;
  return parseVantageParam(new URLSearchParams(raw).get('vantage'));
}
