export type FractalShell = 'node' | 'row' | 'card';

export type FractalBoardProjection = 'graph' | 'list' | 'grid';

export const VANTAGE_MIN = 1;
export const VANTAGE_MAX = 12;
export const DEFAULT_VANTAGE = 10;

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
  if (vantage <= 2) return 'graph';
  if (vantage <= LIST_VANTAGE_MAX) return 'list';
  return 'grid';
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

/** Max grid columns on viewports ≥ {@link GRID_COL_MIN_WIDTH_PX}. */
export const GRID_COL_MAX = 2;
export const GRID_COL_MIN_WIDTH_PX = 400;

/** Spatial ceiling — 2 cols max on large screens, 1 col on narrow containers. */
export function maxColsForWidth(containerWidthPx: number): number {
  if (containerWidthPx >= GRID_COL_MIN_WIDTH_PX) return GRID_COL_MAX;
  return 1;
}

function resolveGridColumnsFromVantage(vantage: number): number {
  if (vantage >= 11) return 1;
  return GRID_COL_MAX;
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
