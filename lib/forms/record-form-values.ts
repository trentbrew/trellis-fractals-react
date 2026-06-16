import { initialRecordFieldValue } from '@/lib/schemas/record-fields';
import type { TypeField } from '@/lib/schemas/record-fields';

export function recordValuesFromFields(
  fields: TypeField[],
  source: Record<string, unknown>,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    values[field.name] = source[field.name];
  }
  return values;
}

export function emptyRecordValues(fields: TypeField[]): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    values[field.name] = initialRecordFieldValue(field);
  }
  return values;
}
