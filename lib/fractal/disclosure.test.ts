import { describe, expect, it } from 'vitest';
import {
  CARD_FIELD_DISCLOSURE,
  DISCLOSURE_WEIGHT,
  inferDisclosureWeight,
  resolveFieldDisclosure,
} from './disclosure';

describe('inferDisclosureWeight', () => {
  it('assigns identity to title fields', () => {
    expect(inferDisclosureWeight('title', 'title')).toBe(DISCLOSURE_WEIGHT.identity);
  });

  it('assigns decision tier to commerce fields', () => {
    expect(inferDisclosureWeight('price', 'number')).toBe(DISCLOSURE_WEIGHT.decision);
    expect(inferDisclosureWeight('cost')).toBe(DISCLOSURE_WEIGHT.decision);
  });

  it('assigns low salience to tags', () => {
    expect(inferDisclosureWeight('tags')).toBe(DISCLOSURE_WEIGHT.tags);
  });
});

describe('resolveFieldDisclosure', () => {
  it('keeps title always visible', () => {
    const result = resolveFieldDisclosure(
      CARD_FIELD_DISCLOSURE.title,
      1,
      'node',
      'title',
    );
    expect(result.visible).toBe(true);
    expect(result.opacity).toBe(1);
    expect(result.mode).toBe('always');
  });

  it('keeps price visible at grid vantage 6', () => {
    const result = resolveFieldDisclosure(
      CARD_FIELD_DISCLOSURE.price,
      6,
      'card',
      'price',
    );
    expect(result.visible).toBe(true);
    expect(result.opacity).toBe(1);
    expect(result.mode).toBe('always');
  });

  it('keeps price visible in list rows', () => {
    const result = resolveFieldDisclosure(
      CARD_FIELD_DISCLOSURE.price,
      4,
      'row',
      'price',
    );
    expect(result.visible).toBe(true);
    expect(result.opacity).toBe(1);
  });

  it('fades category at vantage 6 in grid cards', () => {
    const result = resolveFieldDisclosure(
      CARD_FIELD_DISCLOSURE.category,
      6,
      'card',
      'category',
    );
    expect(result.mode).toBe('fade');
    expect(result.opacity).toBe(0);
  });

  it('shows category with opacity above vantage 7 in grid cards', () => {
    const result = resolveFieldDisclosure(
      CARD_FIELD_DISCLOSURE.category,
      8,
      'card',
      'category',
    );
    expect(result.opacity).toBeGreaterThan(0);
  });

  it('hides tags until vantage 10.5 in grid cards', () => {
    const hidden = resolveFieldDisclosure(
      CARD_FIELD_DISCLOSURE.tags,
      10,
      'card',
      'tags',
    );
    expect(hidden.visible).toBe(false);

    const shown = resolveFieldDisclosure(
      CARD_FIELD_DISCLOSURE.tags,
      10.5,
      'card',
      'tags',
    );
    expect(shown.visible).toBe(true);
    expect(shown.opacity).toBe(1);
    expect(shown.mode).toBe('mount');
  });

  it('keeps tags on grid mount threshold even in list shell', () => {
    const listRow = resolveFieldDisclosure(
      CARD_FIELD_DISCLOSURE.tags,
      5.5,
      'row',
      'tags',
    );
    expect(listRow.visible).toBe(false);

    const grid = resolveFieldDisclosure(
      CARD_FIELD_DISCLOSURE.tags,
      10.5,
      'card',
      'tags',
    );
    expect(grid.visible).toBe(true);
    expect(grid.mode).toBe('mount');
  });
});
