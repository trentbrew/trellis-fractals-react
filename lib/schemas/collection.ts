import { defineType, type InferType } from 'trellis/schema';
import { z } from 'zod';
import type { CollectionViewMode } from '@/lib/registry/collection-views';
import type { TypeField } from '@/lib/schemas/record-fields';
import {
  normalizeTypeFieldConstraints,
  validateTypeFieldConstraints,
} from '@/lib/registry/field-constraints';

export type {
  TypeField,
  TypeFieldDateConfig,
  TypeFieldFormat,
  RecordValidationResult,
} from '@/lib/schemas/record-fields';
export {
  assertRecordFieldUpdate,
  canSubmitRecordForm,
  initialRecordFieldValue,
  isRecordFieldEmpty,
  isSelectValueType,
  normalizeRecordAttributes,
  normalizeRecordFieldValue,
  recordFieldKind,
  recordFieldLabel,
  RecordFieldValidationError,
  validateRecordField,
  validateRecordFieldsByName,
  validateRecordFromType,
} from '@/lib/schemas/record-fields';
export {
  collectionSlugFromCollectionId,
  compileCollectionRecordSchema,
  compileTypeFieldToOntology,
  compileTypeFieldsToOntology,
  type CompiledCollectionSchema,
  type OntologyPropertyType,
  type PropertyValueSpecification,
} from '@/lib/schemas/compile-type-fields';

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

export function normalizeSchemaDraftFields(fields: TypeField[]): TypeField[] {
  return fields.map((field) => normalizeTypeFieldConstraints(field));
}

export function validateSchemaDraftFields(fields: TypeField[]): {
  fieldErrors: Record<number, string[]>;
  formError: string | null;
  valid: boolean;
} {
  const fieldErrors: Record<number, string[]> = {};
  const trimmedNames = fields.map((field) => field.name.trim());

  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
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
      continue;
    }

    const constraintErrors = validateTypeFieldConstraints(field);
    if (constraintErrors.length > 0) {
      fieldErrors[index] = constraintErrors;
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

function metaCreatedAt(item: CollectionMeta): number {
  const created = (item as { createdAt?: string }).createdAt;
  return created ? Date.parse(created) : Number.MAX_SAFE_INTEGER;
}

/** Keep one meta row per slug — earliest created wins when duplicates exist. */
export function dedupeMetaBySlug(items: CollectionMeta[]): CollectionMeta[] {
  const bySlug = new Map<string, CollectionMeta>();
  for (const item of items) {
    const existing = bySlug.get(item.slug);
    if (!existing || metaCreatedAt(item) < metaCreatedAt(existing)) {
      bySlug.set(item.slug, item);
    }
  }
  return [...bySlug.values()];
}

export function sortMeta(items: CollectionMeta[]): CollectionMeta[] {
  return dedupeMetaBySlug(items).sort((a, b) => {
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

