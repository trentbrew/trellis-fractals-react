import type { Transition } from 'framer-motion';
import type { CSSProperties } from 'react';
import {
  DEFAULT_VANTAGE,
  detailOpacity,
  parseVantageFromSearch,
  parseVantageParam,
  resolveBoardProjection,
  resolveGridColumns,
  resolveListRowMetrics,
  resolveShell,
  maxColsForWidth,
  LIST_VANTAGE_MAX,
  LIST_VANTAGE_MIN,
  GRID_VANTAGE_MIN,
  DENSE_GRID_VANTAGE_MAX,
  resolveGridCardVariant,
  resolveGridCardDensity,
  resolveGridGapClass,
  VANTAGE_MAX,
  VANTAGE_MIN,
  type FractalBoardProjection,
  type FractalShell,
  type GridCardVariant,
  type ListRowMetrics,
} from './vantage-math';

export {
  DEFAULT_VANTAGE,
  detailOpacity,
  parseVantageFromSearch,
  parseVantageParam,
  resolveBoardProjection,
  resolveGridColumns,
  resolveListRowMetrics,
  resolveShell,
  maxColsForWidth,
  LIST_VANTAGE_MAX,
  LIST_VANTAGE_MIN,
  GRID_VANTAGE_MIN,
  DENSE_GRID_VANTAGE_MAX,
  resolveGridCardVariant,
  resolveGridCardDensity,
  resolveGridGapClass,
  VANTAGE_MAX,
  VANTAGE_MIN,
  type FractalBoardProjection,
  type FractalShell,
  type GridCardVariant,
  type ListRowMetrics,
};

export type VantageStyle = CSSProperties & Record<'--vantage', string>;

/** Smooth deceleration — no overshoot. */
export const VANTAGE_EASE = [0.22, 1, 0.36, 1] as const;

const VANTAGE_LAYOUT_SPRING = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 44,
  mass: 0.85,
};

/** Critically damped layout reflow while dragging the vantage slider. */
export const VANTAGE_LAYOUT_TRANSITION: Transition = {
  layout: VANTAGE_LAYOUT_SPRING,
};

/** Layout morph plus eased opacity/scale for cards and shells. */
export const VANTAGE_MORPH_TRANSITION: Transition = {
  layout: VANTAGE_LAYOUT_SPRING,
  opacity: { duration: 0.34, ease: VANTAGE_EASE },
  scale: { duration: 0.34, ease: VANTAGE_EASE },
  y: { duration: 0.34, ease: VANTAGE_EASE },
};

/** Crossfade when vantage switches projection mode. */
export const VANTAGE_PROJECTION_TRANSITION: Transition = {
  layout: { type: 'spring', stiffness: 400, damping: 42, mass: 0.9 },
  opacity: { duration: 0.36, ease: VANTAGE_EASE },
  scale: { duration: 0.36, ease: VANTAGE_EASE },
};

const VANTAGE_EASE_CSS = `cubic-bezier(${VANTAGE_EASE.join(', ')})`;

/** CSS timing for max-width / opacity changes outside Framer Motion. */
export const vantageCssTransition =
  `opacity 0.36s ${VANTAGE_EASE_CSS}, max-width 0.42s ${VANTAGE_EASE_CSS}`;

export function vantageStyle(vantage: number): VantageStyle {
  return { '--vantage': String(vantage) };
}
