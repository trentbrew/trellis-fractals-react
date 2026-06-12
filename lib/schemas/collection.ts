import { defineType, type InferType } from 'trellis/schema';
import { z } from 'zod';
import type { CollectionViewMode } from '@/lib/registry/collection-views';

export const DEMO_NS = 'https://trellis.dev/ns/demo/v1' as const;

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'color must be #RRGGBB');

const collectionViewModeSchema = z.enum([
  'table',
  'kanban',
  'calendar',
  'gantt',
  'list',
  'card-grid',
  'dag',
  'json-ld',
]);

const collectionViewPrefsObjectSchema = z.object({
  table: z
    .object({
      columnOrder: z.array(z.string()).optional(),
      hiddenColumns: z.array(z.string()).optional(),
    })
    .optional(),
  cardGrid: z
    .object({
      columns: z.union([z.literal(3), z.literal(4), z.literal(5)]).optional(),
    })
    .optional(),
});

export type CollectionViewPrefs = z.infer<typeof collectionViewPrefsObjectSchema>;

export const CollectionMetaType = defineType(
  'CollectionMeta',
  {
    title: z.string().min(1),
    slug: z.string().min(1).max(64),
    icon: z.string().optional(),
    color: hexColor.optional(),
    description: z.string().max(500).optional(),
    sortOrder: z.number().int().optional(),
    defaultView: collectionViewModeSchema.optional(),
    viewPrefs: collectionViewPrefsObjectSchema.optional(),
  },
  {
    title: 'title',
    extends: 'core:Record',
    label: 'Collection',
  },
);

export const CollectionRecordType = defineType(
  'CollectionRecord',
  {
    collectionId: z.string().min(1),
    title: z.string().min(1),
    body: z.string().max(4000).optional(),
    sortOrder: z.number().int().optional(),
    laneId: z.string().optional(),
  },
  {
    title: 'title',
    extends: 'core:Record',
    label: 'CollectionRecord',
  },
);

export type CollectionMeta = InferType<typeof CollectionMetaType>;
export type CollectionRecord = InferType<typeof CollectionRecordType>;
export type { CollectionViewMode };

export type TypeField = {
  name: string;
  valueType?: string;
  required?: boolean;
  options?: string[];
};

export const COLLECTION_RECORD_TYPE_ID = `${DEMO_NS}/CollectionRecord` as const;

export function collectionRecordTypeId(slug: string): string {
  return `${DEMO_NS}/collections/${slug}/Record`;
}

export const SYSTEM_RECORD_FIELD_NAMES = new Set(['collectionId', 'sortOrder', 'laneId']);

/** Keys reserved for core record identity and system columns — not user-editable. */
export const RESERVED_RECORD_FIELD_NAMES = new Set([
  ...SYSTEM_RECORD_FIELD_NAMES,
  'id',
  'type',
  '@id',
]);

export function isSelectValueType(valueType: string | undefined): boolean {
  return valueType === 'select' || valueType === 'enum';
}

export function normalizeSchemaDraftFields(fields: TypeField[]): TypeField[] {
  return fields.map((field) => ({
    name: field.name.trim(),
    valueType: field.valueType ?? 'string',
    required: Boolean(field.required),
    options: isSelectValueType(field.valueType)
      ? (field.options ?? []).map((option) => option.trim()).filter(Boolean)
      : undefined,
  }));
}

export function validateSchemaDraftFields(fields: TypeField[]): {
  fieldErrors: Record<number, string[]>;
  formError: string | null;
  valid: boolean;
} {
  const fieldErrors: Record<number, string[]> = {};
  const trimmedNames = fields.map((field) => field.name.trim());

  for (let index = 0; index < fields.length; index += 1) {
    const name = trimmedNames[index];
    const errors: string[] = [];

    if (!name) {
      errors.push('Key is required.');
    } else if (RESERVED_RECORD_FIELD_NAMES.has(name)) {
      errors.push(`"${name}" is a reserved system key.`);
    } else if (trimmedNames.filter((candidate) => candidate === name).length > 1) {
      errors.push('Duplicate key.');
    }

    if (errors.length > 0) {
      fieldErrors[index] = errors;
    }
  }

  const hasTitle = trimmedNames.some((name) => name === 'title');
  const formError = hasTitle ? null : 'Include a title field (key: title).';

  return {
    fieldErrors,
    formError,
    valid: Object.keys(fieldErrors).length === 0 && formError === null,
  };
}

export const DEFAULT_COLLECTION_RECORD_FIELDS: TypeField[] = [
  { name: 'title', valueType: 'title', required: true },
  { name: 'body', valueType: 'rich_text' },
];

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function sortMeta(items: CollectionMeta[]): CollectionMeta[] {
  return [...items].sort((a, b) => {
    const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return a.title.localeCompare(b.title);
  });
}

export function sortRecords(items: CollectionRecord[]): CollectionRecord[] {
  return [...items].sort((a, b) => {
    const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return a.title.localeCompare(b.title);
  });
}

const recordFieldsSchema = CollectionRecordType.zod.pick({ title: true, body: true });

export function validateRecordFields(input: {
  title: string;
  body?: string;
}): { ok: true } | { ok: false; message: string } {
  const parsed = recordFieldsSchema.safeParse({
    title: input.title.trim(),
    body: input.body?.trim() ? input.body.trim() : undefined,
  });
  if (parsed.success) return { ok: true };
  const issue = parsed.error.issues[0];
  return { ok: false, message: issue?.message ?? 'Invalid record' };
}

function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

function recordFieldKind(field: TypeField): string {
  switch (field.valueType) {
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'date':
      return 'date';
    case 'select':
    case 'enum':
      return 'select';
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
    const text = String(raw).trim();
    return text || undefined;
  }

  if (kind === 'select') {
    const text = String(raw).trim();
    return text || undefined;
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

export function validateRecordFromType(
  fields: TypeField[],
  values: Record<string, unknown>,
): { ok: true } | { ok: false; message: string; fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {};

  for (const field of fields) {
    const raw = values[field.name];
    const normalized = normalizeRecordFieldValue(field, raw);
    const label = field.name
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());

    if (field.required && isRecordFieldEmpty(field, raw)) {
      fieldErrors[field.name] = `${label} is required`;
      continue;
    }

    if (isEmptyValue(raw) && raw !== false) continue;

    const kind = recordFieldKind(field);

    if (kind === 'number' && !isEmptyValue(raw) && normalized === undefined) {
      fieldErrors[field.name] = 'Enter a valid number';
      continue;
    }

    if (field.valueType === 'url' && normalized) {
      try {
        new URL(String(normalized));
      } catch {
        fieldErrors[field.name] = 'Enter a valid URL';
        continue;
      }
    }

    if (kind === 'select' && field.options?.length && normalized) {
      if (!field.options.includes(String(normalized))) {
        fieldErrors[field.name] = 'Select a valid option';
      }
    }

    if (kind === 'date' && normalized) {
      const text = String(normalized);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(text))) {
        fieldErrors[field.name] = 'Enter a valid date';
      }
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    const first = Object.values(fieldErrors)[0] ?? 'Invalid record';
    return { ok: false, message: first, fieldErrors };
  }

  return { ok: true };
}
