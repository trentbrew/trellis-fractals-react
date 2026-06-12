import { describe, expect, it } from 'vitest';
import {
  resolveCrossProjectionLayoutId,
  resolveVantageCardPresence,
  resolveVantageCssTransition,
  resolveVantageLayout,
  resolveVantageMorphTransition,
} from './vantage-motion-types';

describe('resolveVantageLayout', () => {
  it('uses full size morph in full motion', () => {
    expect(resolveVantageLayout('full')).toBe(true);
    expect(resolveVantageLayout('full', { recordMorph: true })).toBe(true);
  });

  it('uses position-only layout in minimal motion except record morph', () => {
    expect(resolveVantageLayout('minimal')).toBe('position');
    expect(resolveVantageLayout('minimal', { recordMorph: true })).toBe(true);
  });

  it('disables layout in reduced motion', () => {
    expect(resolveVantageLayout('reduced')).toBe(false);
  });
});

describe('resolveCrossProjectionLayoutId', () => {
  it('shares layout ids only in full motion', () => {
    expect(resolveCrossProjectionLayoutId('full', 'card-1')).toBe('card-card-1');
    expect(resolveCrossProjectionLayoutId('minimal', 'card-1')).toBeUndefined();
    expect(resolveCrossProjectionLayoutId('reduced', 'card-1')).toBeUndefined();
  });
});

describe('resolveVantageMorphTransition', () => {
  it('zeroes transitions in reduced motion', () => {
    expect(resolveVantageMorphTransition('reduced')).toEqual({ duration: 0 });
  });
});

describe('resolveVantageCssTransition', () => {
  it('omits css transitions in reduced motion', () => {
    expect(resolveVantageCssTransition('reduced')).toBeUndefined();
    expect(resolveVantageCssTransition('minimal')).toContain('opacity');
  });
});

describe('resolveVantageCardPresence', () => {
  it('skips enter/exit motion in reduced mode', () => {
    const reduced = resolveVantageCardPresence('reduced');
    expect(reduced.initial).toBe(false);
    expect(reduced.exit).toEqual({ opacity: 1, scale: 1 });
  });
});
