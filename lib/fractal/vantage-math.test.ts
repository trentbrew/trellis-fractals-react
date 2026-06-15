import { describe, expect, it } from 'vitest';
import {
  GRAPH_VANTAGE_MAX,
  LIST_VANTAGE_MAX,
  LIST_VANTAGE_MIN,
  resolveBoardProjection,
  resolveGraphListCrossfade,
  resolveGridCardVariant,
  resolveGridColumns,
  resolveListRowMetrics,
} from './vantage-math';

describe('resolveBoardProjection', () => {
  it('maps low vantage to graph', () => {
    expect(resolveBoardProjection(1)).toBe('graph');
    expect(resolveBoardProjection(2)).toBe('graph');
  });

  it('keeps row-shell vantages on list projection', () => {
    expect(resolveBoardProjection(3)).toBe('list');
    expect(resolveBoardProjection(LIST_VANTAGE_MAX)).toBe('list');
  });

  it('starts grid after the list band', () => {
    expect(resolveBoardProjection(LIST_VANTAGE_MAX + 1)).toBe('grid');
    expect(resolveBoardProjection(12)).toBe('grid');
  });
});

describe('resolveGraphListCrossfade', () => {
  it('shows graph only at or below the graph band', () => {
    expect(resolveGraphListCrossfade(1)).toEqual({ graph: 1, list: 0 });
    expect(resolveGraphListCrossfade(GRAPH_VANTAGE_MAX)).toEqual({ graph: 1, list: 0 });
  });

  it('shows list only at or above the list band', () => {
    expect(resolveGraphListCrossfade(LIST_VANTAGE_MIN)).toEqual({ graph: 0, list: 1 });
    expect(resolveGraphListCrossfade(LIST_VANTAGE_MAX)).toEqual({ graph: 0, list: 1 });
  });

  it('crossfades both layers between graph and list bands', () => {
    expect(resolveGraphListCrossfade(2.5)).toEqual({ graph: 0.5, list: 0.5 });
    expect(resolveGraphListCrossfade(2.25)).toEqual({ graph: 0.75, list: 0.25 });
  });
});

describe('resolveListRowMetrics', () => {
  it('grows row density across the list band', () => {
    const compact = resolveListRowMetrics(LIST_VANTAGE_MIN);
    const rich = resolveListRowMetrics(LIST_VANTAGE_MAX);

    expect(parseFloat(compact.minHeight)).toBeLessThan(parseFloat(rich.minHeight));
    expect(parseFloat(compact.thumbSize)).toBeLessThan(parseFloat(rich.thumbSize));
  });
});

describe('resolveGridColumns', () => {
  it('uses vantage-only columns when width is omitted', () => {
    expect(resolveGridColumns(7)).toBe(6);
    expect(resolveGridColumns(8)).toBe(5);
    expect(resolveGridColumns(10)).toBe(3);
    expect(resolveGridColumns(11)).toBe(2);
    expect(resolveGridColumns(12)).toBe(1);
  });

  it('caps dense grids on large containers', () => {
    expect(resolveGridColumns(7, 1200)).toBe(6);
    expect(resolveGridColumns(8, 1000)).toBe(5);
    expect(resolveGridColumns(9, 960)).toBe(4);
    expect(resolveGridColumns(11, 1200)).toBe(2);
    expect(resolveGridColumns(12, 1200)).toBe(1);
  });

  it('uses one column on narrow containers', () => {
    expect(resolveGridColumns(10, 390)).toBe(1);
    expect(resolveGridColumns(7, 390)).toBe(1);
  });
});

describe('resolveGridCardVariant', () => {
  it('steps through compact, tile, card, and panel shells', () => {
    expect(resolveGridCardVariant(7)).toBe('compact');
    expect(resolveGridCardVariant(8)).toBe('tile');
    expect(resolveGridCardVariant(9)).toBe('card');
    expect(resolveGridCardVariant(11)).toBe('panel');
  });
});
