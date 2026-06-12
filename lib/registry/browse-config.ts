import type { AnyType } from 'trellis/schema';
import { z } from 'zod';
import type { ColumnDef } from './columns';
import { fieldLabel, innerZodType } from './zod-shape';

export type BrowseSortDir = 'asc' | 'desc';

export type BrowseField<E> = {
  key: keyof E & string;
  label: string;
  searchable?: boolean;
  sortable?: boolean;
};

export type BrowseConfig<E> = {
  fields: BrowseField<E>[];
  defaultSort: keyof E & string;
  defaultDir?: BrowseSortDir;
  searchKeys?: Array<keyof E & string>;
};

const TABLE_COLUMN_SKIP = new Set(['id', 'type', 'collectionId', 'colorIndex', 'sortOrder', 'laneId']);

/** Derive browse fields from a defineType schema — parallel to suggestCollectionViews. */
export function getBrowseConfig<E extends Record<string, unknown>>(
  schema: AnyType,
): BrowseConfig<E> {
  const fields: BrowseField<E>[] = [];
  const shape = schema.zod.shape;

  for (const [key, fieldSchema] of Object.entries(shape)) {
    const inner = innerZodType(fieldSchema as z.ZodTypeAny);
    const label = fieldLabel(key);
    const entry: BrowseField<E> = { key: key as keyof E & string, label };

    if (inner instanceof z.ZodString) {
      entry.searchable = true;
      entry.sortable = true;
    } else if (inner instanceof z.ZodNumber || inner instanceof z.ZodBoolean) {
      entry.sortable = true;
    } else if (inner instanceof z.ZodEnum) {
      entry.searchable = true;
      entry.sortable = true;
    } else if (inner instanceof z.ZodDate) {
      entry.sortable = true;
    }

    if (entry.searchable || entry.sortable) fields.push(entry);
  }

  const hasCreatedAt = fields.some((f) => f.key === 'createdAt');
  if (hasCreatedAt) {
    const created = fields.find((f) => f.key === 'createdAt')!;
    created.sortable = true;
    created.searchable = false;
  }

  const defaultSort =
    (hasCreatedAt ? 'createdAt' : fields.find((f) => f.sortable)?.key ?? 'title') as keyof E &
      string;

  const searchKeys = fields.filter((f) => f.searchable).map((f) => f.key);

  return {
    fields,
    defaultSort,
    defaultDir: 'desc',
    searchKeys,
  };
}

/** @deprecated Use getBrowseConfig */
export const inferBrowseConfig = getBrowseConfig;

/** Map browse type to editable table columns (searchable string fields). */
export function tableColumnsFromBrowseConfig<E extends Record<string, unknown>>(
  schema: AnyType,
  config: BrowseConfig<E>,
): ColumnDef<E>[] {
  const shape = schema.zod.shape;

  return config.fields
    .filter((field) => field.searchable && !TABLE_COLUMN_SKIP.has(field.key))
    .map((field) => {
      const inner = innerZodType(shape[field.key] as z.ZodTypeAny);
      const editor = inner instanceof z.ZodString ? ('text' as const) : ('none' as const);
      return {
        key: field.key,
        label: field.label,
        editor,
      };
    })
    .filter((col) => col.editor !== 'none');
}
