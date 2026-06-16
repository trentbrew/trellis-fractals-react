import {
  normalizeRecordColorValue,
  normalizeRecordIconValue,
  recordDateInputValue,
} from '@/lib/record-field-normalize';

export type TypeFieldDateConfig = {
  includeTime?: boolean;
};

export type TypeFieldFormat = 'plain' | 'currency' | 'percent';

export type TypeField = {
  name: string;
  valueType?: string;
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  date?: TypeFieldDateConfig;
  format?: TypeFieldFormat;
  currency?: string;
  placeholder?: string;
  helpText?: string;
};

export function isSelectValueType(valueType: string | undefined): boolean {
  return valueType === 'select' || valueType === 'enum';
}

export function recordFieldLabel(key: string): string {
  if (key === 'id') return 'ID';
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

export function recordFieldKind(field: TypeField): string {
  switch (field.valueType) {
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'date':
      return 'date';
    case 'color':
      return 'color';
    case 'icon':
      return 'icon';
    case 'select':
    case 'enum':
      return 'select';
    case 'reference':
    case 'relationship':
      return 'text';
    case 'email':
    case 'phone_number':
    case 'url':
      return 'text';
    case 'rich_text':
      return 'longtext';
    default:
      return 'text';
  }
}

export function isRecordFieldEmpty(field: TypeField, value: unknown): boolean {
  const kind = recordFieldKind(field);
  if (kind === 'boolean') return false;
  if (value === undefined || value === null) return true;
  if (kind === 'number') {
    if (value === '') return true;
    const numeric = typeof value === 'number' ? value : Number(String(value).trim());
    return !Number.isFinite(numeric);
  }
  return isEmptyValue(value);
}

export function initialRecordFieldValue(field: TypeField): unknown {
  if (field.valueType === 'boolean') return false;
  return '';
}

export function normalizeRecordFieldValue(field: TypeField, raw: unknown): unknown {
  const kind = recordFieldKind(field);
  if (raw === undefined || raw === null) return undefined;

  if (kind === 'boolean') return Boolean(raw);

  if (kind === 'number') {
    if (raw === '') return undefined;
    const numeric = typeof raw === 'number' ? raw : Number(String(raw).trim());
    return Number.isFinite(numeric) ? numeric : undefined;
  }

  if (kind === 'date') {
    const text = recordDateInputValue(raw);
    return text || undefined;
  }

  if (kind === 'color') {
    return normalizeRecordColorValue(raw);
  }

  if (kind === 'icon') {
    return normalizeRecordIconValue(raw);
  }

  if (kind === 'select') {
    const text = String(raw).trim();
    return text || undefined;
  }

  if (field.valueType === 'phone_number') {
    const digits = String(raw).replace(/\D/g, '');
    if (!digits) return undefined;
    if (String(raw).trim().startsWith('+')) return `+${digits}`;
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    return `+${digits}`;
  }

  const text = String(raw).trim();
  return text || undefined;
}

export function normalizeRecordAttributes(
  fields: TypeField[],
  values: Record<string, unknown>,
): Record<string, unknown> {
  const attributes: Record<string, unknown> = {};
  for (const field of fields) {
    attributes[field.name] = normalizeRecordFieldValue(field, values[field.name]);
  }
  return attributes;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function plainTextLength(value: string): number {
  return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().length;
}

function isValidDateValue(value: string, includeTime: boolean): boolean {
  if (includeTime) {
    return !Number.isNaN(Date.parse(value));
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

export function validateRecordField(
  field: TypeField,
  raw: unknown,
  normalized: unknown,
): string | null {
  const label = recordFieldLabel(field.name);

  if (field.required && isRecordFieldEmpty(field, raw)) {
    return `${label} is required`;
  }

  if (isEmptyValue(raw) && raw !== false) return null;

  const kind = recordFieldKind(field);

  if (kind === 'number' && !isEmptyValue(raw) && normalized === undefined) {
    return 'Enter a valid number';
  }

  if (kind === 'number' && typeof normalized === 'number') {
    if (field.min !== undefined && normalized < field.min) {
      return `Must be at least ${field.min}`;
    }
    if (field.max !== undefined && normalized > field.max) {
      return `Must be at most ${field.max}`;
    }
  }

  if (normalized && (kind === 'text' || kind === 'longtext')) {
    const text =
      kind === 'longtext' && field.valueType === 'rich_text'
        ? String(normalized)
        : String(normalized);
    const length =
      field.valueType === 'rich_text' ? plainTextLength(text) : text.length;

    if (field.minLength !== undefined && length < field.minLength) {
      return `Must be at least ${field.minLength} characters`;
    }
    if (field.maxLength !== undefined && length > field.maxLength) {
      return `Must be at most ${field.maxLength} characters`;
    }
    if (field.pattern) {
      try {
        if (!new RegExp(field.pattern).test(text)) {
          return 'Invalid format';
        }
      } catch {
        // ignore invalid pattern in schema
      }
    }
  }

  if (field.valueType === 'email' && normalized) {
    if (!EMAIL_PATTERN.test(String(normalized))) {
      return 'Enter a valid email';
    }
  }

  if (field.valueType === 'phone_number' && normalized) {
    const digits = String(normalized).replace(/\D/g, '');
    if (digits.length < 10) {
      return 'Enter a valid phone number';
    }
  }

  if (field.valueType === 'url' && normalized) {
    try {
      new URL(String(normalized));
    } catch {
      return 'Enter a valid URL';
    }
  }

  if (kind === 'select' && field.options?.length && normalized) {
    if (!field.options.includes(String(normalized))) {
      return 'Select a valid option';
    }
  }

  if (kind === 'date' && normalized) {
    const includeTime = Boolean(field.date?.includeTime);
    if (!isValidDateValue(String(normalized), includeTime)) {
      return includeTime ? 'Enter a valid date and time' : 'Enter a valid date';
    }
  }

  if (field.valueType === 'color' && normalized) {
    if (!/^#[0-9a-fA-F]{6}$/.test(String(normalized))) {
      return 'Enter a valid color (#RRGGBB)';
    }
  }

  return null;
}

export type RecordValidationResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors: Record<string, string> };

export function validateRecordFieldsByName(
  fields: TypeField[],
  fieldNames: string[],
  values: Record<string, unknown>,
): RecordValidationResult {
  const names = new Set(fieldNames);
  return validateRecordFromType(fields.filter((field) => names.has(field.name)), values);
}

export function validateRecordFromType(
  fields: TypeField[],
  values: Record<string, unknown>,
): RecordValidationResult {
  const fieldErrors: Record<string, string> = {};

  for (const field of fields) {
    const raw = values[field.name];
    const normalized = normalizeRecordFieldValue(field, raw);
    const error = validateRecordField(field, raw, normalized);
    if (error) fieldErrors[field.name] = error;
  }

  if (Object.keys(fieldErrors).length > 0) {
    const first = Object.values(fieldErrors)[0] ?? 'Invalid record';
    return { ok: false, message: first, fieldErrors };
  }

  return { ok: true };
}

export function canSubmitRecordForm(
  fields: TypeField[],
  values: Record<string, unknown>,
): boolean {
  const requiredFields = fields.filter((field) => field.required);
  if (requiredFields.length === 0) {
    return fields.some((field) => !isRecordFieldEmpty(field, values[field.name]));
  }
  return requiredFields.every((field) => !isRecordFieldEmpty(field, values[field.name]));
}

export class RecordFieldValidationError extends Error {
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'RecordFieldValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export function assertRecordFieldUpdate(
  fields: TypeField[],
  values: Record<string, unknown>,
  key: string,
): void {
  const check = validateRecordFromType(fields, values);
  if (!check.ok) {
    const message = check.fieldErrors[key] ?? check.message;
    throw new RecordFieldValidationError(message, check.fieldErrors);
  }
}
