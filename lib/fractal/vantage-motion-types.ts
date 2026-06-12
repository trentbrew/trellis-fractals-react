import type { TargetAndTransition, Transition } from 'framer-motion';
import {
  VANTAGE_LAYOUT_TRANSITION,
  VANTAGE_MORPH_TRANSITION,
  VANTAGE_PROJECTION_TRANSITION,
  vantageCssTransition,
} from '@/lib/fractal/vantage';

export type VantageMotion = 'full' | 'minimal' | 'reduced';

export const VANTAGE_MOTION_OPTIONS: VantageMotion[] = ['full', 'minimal', 'reduced'];

export const DEFAULT_VANTAGE_MOTION: VantageMotion = 'minimal';

export const VANTAGE_MOTION_STORAGE_KEY = 'playground:vantage-motion';

export const VANTAGE_MOTION_LABELS: Record<VantageMotion, string> = {
  full: 'Full motion',
  minimal: 'Minimal motion',
  reduced: 'Reduced motion',
};

export type VantageLayoutMode = boolean | 'position';

const REDUCED_TRANSITION: Transition = { duration: 0 };

export function isVantageMotion(value: string | null | undefined): value is VantageMotion {
  return value === 'full' || value === 'minimal' || value === 'reduced';
}

/** Layout mode for Framer `layout` — full morph, position-only, or off. */
export function resolveVantageLayout(
  motion: VantageMotion,
  options?: { recordMorph?: boolean },
): VantageLayoutMode {
  if (motion === 'reduced') return false;
  if (motion === 'full') return true;
  return options?.recordMorph ? true : 'position';
}

/** Shared layout id across list ↔ grid — only in full motion. */
export function resolveCrossProjectionLayoutId(
  motion: VantageMotion,
  cardId: string,
): string | undefined {
  return motion === 'full' ? `card-${cardId}` : undefined;
}

export function resolveVantageMorphTransition(motion: VantageMotion): Transition {
  return motion === 'reduced' ? REDUCED_TRANSITION : VANTAGE_MORPH_TRANSITION;
}

export function resolveVantageLayoutTransition(motion: VantageMotion): Transition {
  return motion === 'reduced' ? REDUCED_TRANSITION : VANTAGE_LAYOUT_TRANSITION;
}

export function resolveVantageProjectionTransition(motion: VantageMotion): Transition {
  return motion === 'reduced' ? REDUCED_TRANSITION : VANTAGE_PROJECTION_TRANSITION;
}

export function resolveVantageCssTransition(motion: VantageMotion): string | undefined {
  return motion === 'reduced' ? undefined : vantageCssTransition;
}

export type VantagePresenceMotion = {
  initial: TargetAndTransition | false;
  animate: TargetAndTransition;
  exit: TargetAndTransition;
};

export function resolveVantageCardPresence(motion: VantageMotion): VantagePresenceMotion {
  if (motion === 'reduced') {
    return {
      initial: false,
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 1, scale: 1 },
    };
  }
  return {
    initial: { opacity: 0, scale: 0.92 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.92, y: 8 },
  };
}

export function resolveVantageListPresence(motion: VantageMotion): VantagePresenceMotion {
  if (motion === 'reduced') {
    return {
      initial: false,
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 1, y: 0 },
    };
  }
  return {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 6 },
  };
}

export function resolveRecordDialogTransition(motion: VantageMotion): Transition {
  if (motion === 'reduced') return REDUCED_TRANSITION;
  return { type: 'spring', bounce: 0.2, duration: 0.5 };
}
