import type { SpreadsheetCellKind, SpreadsheetColumn } from '@/components/boards/spreadsheet/SpreadsheetTable';
import { formatFieldDisplayValue } from '@/lib/registry/field-constraints';
import {
  COLLECTION_RECORD_TYPE_ID,
  DEFAULT_COLLECTION_RECORD_FIELDS,
  SYSTEM_RECORD_FIELD_NAMES,
  collectionRecordTypeId,
  type TypeField,
} from '@/lib/schemas/collection';
import type { TypeDef } from '@/lib/trellis/use-types';

export const VALUE_TYPE_OPTIONS = [
  { value: 'string', label: 'Text' },
  { value: 'title', label: 'Title' },
  { value: 'rich_text', label: 'Long text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'email', label: 'Email' },
  { value: 'phone_number', label: 'Phone' },
  { value: 'color', label: 'Color' },
  { value: 'icon', label: 'Icon' },
  { value: 'select', label: 'Select' },
  { value: 'url', label: 'URL' },
  { value: 'reference', label: 'Relationship' },
] as const;

export function fieldLabel(key: string): string {
  if (key === 'id') return 'ID';
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function valueTypeToSpreadsheetKind(
  valueType: string | undefined,
  name: string,
): SpreadsheetCellKind {
  switch (valueType) {
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
      return 'reference';
    case 'rich_text':
      return name === 'body' || name.endsWith('Body') ? 'longtext' : 'longtext';
    case 'title':
    case 'string':
    case 'email':
    case 'phone_number':
    case 'url':
    default:
      return 'text';
  }
}

export function isEditableTypeField(field: TypeField): boolean {
  return Boolean(field.name) && !SYSTEM_RECORD_FIELD_NAMES.has(field.name);
}

export function editableTypeFields(fields: TypeField[] | undefined): TypeField[] {
  return (fields ?? []).filter(isEditableTypeField);
}

export function typeToSpreadsheetColumns(fields: TypeField[] | undefined): SpreadsheetColumn[] {
  return editableTypeFields(fields).map((field) => ({
    key: field.name,
    label: fieldLabel(field.name),
    kind: valueTypeToSpreadsheetKind(field.valueType, field.name),
    width: field.valueType === 'rich_text' ? 420 : field.name === 'title' ? 240 : 180,
    required: field.required,
    options: field.options,
    min: field.min,
    max: field.max,
    step: field.step,
    minLength: field.minLength,
    maxLength: field.maxLength,
    format: field.format,
    currency: field.currency,
    includeTime: field.date?.includeTime,
    valueType: field.valueType,
  }));
}

export { formatFieldDisplayValue };

export function resolveCollectionType(
  types: TypeDef[],
  slug: string,
): TypeDef {
  const perCollectionId = collectionRecordTypeId(slug);
  const perCollection = types.find((type) => type['@id'] === perCollectionId);
  if (perCollection?.fields?.length) return perCollection;

  const global = types.find((type) => type['@id'] === COLLECTION_RECORD_TYPE_ID);
  if (global?.fields?.length) return global;

  return {
    '@id': perCollectionId,
    label: 'CollectionRecord',
    fields: DEFAULT_COLLECTION_RECORD_FIELDS,
  };
}

export function withSystemRecordFields(userFields: TypeField[]): TypeField[] {
  const cleaned = editableTypeFields(userFields);
  const systemFields: TypeField[] = [
    { name: 'collectionId', valueType: 'rich_text', required: true },
    { name: 'sortOrder', valueType: 'number' },
    { name: 'laneId', valueType: 'rich_text' },
  ];
  return [...cleaned, ...systemFields];
}
