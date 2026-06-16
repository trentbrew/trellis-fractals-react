import { isSelectValueType } from '@/lib/schemas/record-fields';
import type { TypeField, TypeFieldFormat } from '@/lib/schemas/record-fields';

const TEXT_VALUE_TYPES = new Set([
  'string',
  'title',
  'rich_text',
  'url',
  'email',
  'phone_number',
]);

const NUMBER_VALUE_TYPES = new Set(['number']);

export function isTextValueType(valueType?: string): boolean {
  return TEXT_VALUE_TYPES.has(valueType ?? 'string');
}

export function isNumberValueType(valueType?: string): boolean {
  return NUMBER_VALUE_TYPES.has(valueType ?? '');
}

export function isDateValueType(valueType?: string): boolean {
  return valueType === 'date';
}

export function hasSchemaConstraints(valueType?: string): boolean {
  return isTextValueType(valueType) || isNumberValueType(valueType) || isDateValueType(valueType);
}

function parseOptionalNumber(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function parseOptionalInt(raw: string): number | undefined {
  const numeric = parseOptionalNumber(raw);
  if (numeric === undefined) return undefined;
  return Number.isInteger(numeric) ? numeric : undefined;
}

export function stripIncompatibleConstraints(field: TypeField): TypeField {
  const next: TypeField = { ...field };
  const valueType = next.valueType ?? 'string';

  if (!isTextValueType(valueType)) {
    delete next.minLength;
    delete next.maxLength;
    delete next.pattern;
  }

  if (!isNumberValueType(valueType)) {
    delete next.min;
    delete next.max;
    delete next.step;
    delete next.format;
    delete next.currency;
  }

  if (!isDateValueType(valueType)) {
    delete next.date;
  }

  if (next.format !== 'currency') {
    delete next.currency;
  }

  if (!isSelectValueType(valueType)) {
    delete next.options;
  }

  return next;
}

export function mergeTypeFieldPatch(field: TypeField, patch: Partial<TypeField>): TypeField {
  const merged = { ...field, ...patch };
  if (patch.valueType !== undefined && patch.valueType !== field.valueType) {
    return stripIncompatibleConstraints(merged);
  }
  return merged;
}

export function normalizeTypeFieldConstraints(field: TypeField): TypeField {
  const base = stripIncompatibleConstraints({
    ...field,
    name: field.name.trim(),
    valueType: field.valueType ?? 'string',
    required: Boolean(field.required),
    options: isSelectValueType(field.valueType)
      ? (field.options ?? []).map((option) => option.trim()).filter(Boolean)
      : undefined,
  });

  const next: TypeField = { ...base };

  if (next.minLength !== undefined && !Number.isInteger(next.minLength)) delete next.minLength;
  if (next.maxLength !== undefined && !Number.isInteger(next.maxLength)) delete next.maxLength;
  if (next.pattern !== undefined && !next.pattern.trim()) delete next.pattern;
  if (next.min !== undefined && !Number.isFinite(next.min)) delete next.min;
  if (next.max !== undefined && !Number.isFinite(next.max)) delete next.max;
  if (next.step !== undefined && !Number.isFinite(next.step)) delete next.step;
  if (next.placeholder !== undefined && !next.placeholder.trim()) delete next.placeholder;
  if (next.helpText !== undefined && !next.helpText.trim()) delete next.helpText;
  if (next.currency !== undefined && !next.currency.trim()) delete next.currency;

  if (next.date && !next.date.includeTime) {
    delete next.date;
  }

  return next;
}

export function validateTypeFieldConstraints(field: TypeField): string[] {
  const errors: string[] = [];

  if (
    field.minLength !== undefined &&
    field.maxLength !== undefined &&
    field.minLength > field.maxLength
  ) {
    errors.push('Min length cannot exceed max length.');
  }

  if (field.min !== undefined && field.max !== undefined && field.min > field.max) {
    errors.push('Min value cannot exceed max value.');
  }

  if (field.pattern) {
    try {
      void new RegExp(field.pattern);
    } catch {
      errors.push('Pattern is not a valid regular expression.');
    }
  }

  return errors;
}

export function parseConstraintNumberInput(raw: string): number | undefined {
  return parseOptionalNumber(raw);
}

export function parseConstraintIntInput(raw: string): number | undefined {
  return parseOptionalInt(raw);
}

export const NUMBER_FORMAT_OPTIONS: { value: TypeFieldFormat; label: string }[] = [
  { value: 'plain', label: 'Plain' },
  { value: 'currency', label: 'Currency' },
  { value: 'percent', label: 'Percent' },
];

export function formatFieldDisplayValue(field: TypeField, value: unknown): string {
  if (value === undefined || value === null || value === '') return '';

  if (field.valueType === 'number' && typeof value === 'number') {
    if (field.format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: field.currency ?? 'USD',
      }).format(value);
    }
    if (field.format === 'percent') {
      return `${value}%`;
    }
  }

  return String(value);
}
