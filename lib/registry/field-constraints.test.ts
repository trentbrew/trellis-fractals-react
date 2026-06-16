import { describe, expect, it } from 'vitest';
import {
  formatFieldDisplayValue,
  mergeTypeFieldPatch,
  normalizeTypeFieldConstraints,
  stripIncompatibleConstraints,
  validateTypeFieldConstraints,
} from './field-constraints';
import type { TypeField } from '@/lib/schemas/record-fields';

describe('mergeTypeFieldPatch', () => {
  it('strips number constraints when switching to text', () => {
    const field: TypeField = {
      name: 'amount',
      valueType: 'number',
      min: 0,
      max: 100,
      format: 'currency',
      currency: 'USD',
    };
    const next = mergeTypeFieldPatch(field, { valueType: 'string' });
    expect(next.min).toBeUndefined();
    expect(next.format).toBeUndefined();
    expect(next.valueType).toBe('string');
  });
});

describe('normalizeTypeFieldConstraints', () => {
  it('preserves saved constraints on text and number fields', () => {
    const field: TypeField = {
      name: 'score',
      valueType: 'number',
      required: true,
      min: 0,
      max: 10,
      format: 'plain',
    };
    const normalized = normalizeTypeFieldConstraints(field);
    expect(normalized).toMatchObject({ min: 0, max: 10, required: true });
  });

  it('keeps includeTime date config', () => {
    const field: TypeField = {
      name: 'dueAt',
      valueType: 'date',
      date: { includeTime: true },
    };
    expect(normalizeTypeFieldConstraints(field).date).toEqual({ includeTime: true });
  });
});

describe('validateTypeFieldConstraints', () => {
  it('rejects min greater than max', () => {
    const errors = validateTypeFieldConstraints({
      name: 'x',
      valueType: 'number',
      min: 10,
      max: 2,
    });
    expect(errors[0]).toMatch(/min value/i);
  });
});

describe('formatFieldDisplayValue', () => {
  it('formats currency numbers', () => {
    const text = formatFieldDisplayValue(
      { name: 'price', valueType: 'number', format: 'currency', currency: 'USD' },
      12.5,
    );
    expect(text).toContain('12.50');
  });
});

describe('stripIncompatibleConstraints', () => {
  it('removes select options for non-select types', () => {
    const field: TypeField = {
      name: 'status',
      valueType: 'string',
      options: ['a', 'b'],
    };
    expect(stripIncompatibleConstraints(field).options).toBeUndefined();
  });
});
