import { describe, expect, it } from 'vitest';
import {
  normalizeRecordFieldValue,
  validateRecordField,
  validateRecordFieldsByName,
  validateRecordFromType,
  type TypeField,
} from './record-fields';

const titleField: TypeField = { name: 'title', valueType: 'title', required: true };
const bodyField: TypeField = { name: 'body', valueType: 'rich_text', maxLength: 100 };

describe('validateRecordField', () => {
  it('requires required fields', () => {
    expect(validateRecordField(titleField, '', undefined)).toMatch(/required/i);
  });

  it('enforces number min and max', () => {
    const field: TypeField = { name: 'rating', valueType: 'number', min: 0, max: 5 };
    expect(validateRecordField(field, 6, 6)).toMatch(/at most/i);
    expect(validateRecordField(field, -1, -1)).toMatch(/at least/i);
    expect(validateRecordField(field, 3, 3)).toBeNull();
  });

  it('enforces maxLength on plain text', () => {
    const field: TypeField = { name: 'code', valueType: 'string', maxLength: 4 };
    expect(validateRecordField(field, 'toolong', 'toolong')).toMatch(/at most/i);
    expect(validateRecordField(field, 'ok', 'ok')).toBeNull();
  });

  it('counts rich text length without markup', () => {
    const html = '<p>hello</p>';
    expect(validateRecordField(bodyField, html, html)).toBeNull();
    const longHtml = `<p>${'a'.repeat(120)}</p>`;
    expect(validateRecordField(bodyField, longHtml, longHtml)).toMatch(/at most/i);
  });

  it('validates email', () => {
    const field: TypeField = { name: 'email', valueType: 'email' };
    expect(validateRecordField(field, 'bad', 'bad')).toMatch(/valid email/i);
    expect(validateRecordField(field, 'a@b.co', 'a@b.co')).toBeNull();
  });

  it('validates phone numbers', () => {
    const field: TypeField = { name: 'phone', valueType: 'phone_number' };
    expect(validateRecordField(field, '123', '+123')).toMatch(/valid phone/i);
    expect(validateRecordField(field, '4155551234', '+14155551234')).toBeNull();
  });
});

describe('normalizeRecordFieldValue', () => {
  it('normalizes US phone to E.164', () => {
    const field: TypeField = { name: 'phone', valueType: 'phone_number' };
    expect(normalizeRecordFieldValue(field, '(415) 555-1234')).toBe('+14155551234');
  });
});

describe('validateRecordFromType', () => {
  it('returns field errors map', () => {
    const result = validateRecordFromType([titleField, bodyField], { title: '', body: 'x' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.title).toBeTruthy();
    }
  });

  it('passes valid record', () => {
    const result = validateRecordFromType([titleField, bodyField], {
      title: 'Hello',
      body: 'World',
    });
    expect(result.ok).toBe(true);
  });
});

describe('validateRecordFieldsByName', () => {
  it('validates only the requested field subset', () => {
    const result = validateRecordFieldsByName([titleField, bodyField], ['title'], {
      title: '',
      body: 'ignored for this step',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.title).toBeTruthy();
      expect(result.fieldErrors.body).toBeUndefined();
    }
  });
});
