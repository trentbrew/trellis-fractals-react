import { EXPLORER_SCHEMAS } from '@/lib/trellis/bootstrap-schemas';
import { DEMO_NS, type TypeField } from '@/lib/schemas/collection';
import type { TypeDef } from '@/lib/trellis/use-types';

const BUILTIN_TYPE_NAMES = new Set(EXPLORER_SCHEMAS.map((schema) => schema.type));

export const COLLECTIONS_RESERVED_SLUGS = new Set(['types']);

export type TypeKind = 'global' | 'collection' | 'builtin';

export function typeKind(type: TypeDef): TypeKind {
  const id = type['@id'] ?? '';
  const label = type.label ?? id.split('/').pop() ?? '';

  if (BUILTIN_TYPE_NAMES.has(label) && id.includes(`${DEMO_NS}/`)) {
    return 'builtin';
  }

  if (id.includes(`${DEMO_NS}/collections/`) && id.endsWith('/Record')) {
    return 'collection';
  }

  return 'global';
}

export function collectionSlugFromTypeId(id: string): string | null {
  const prefix = `${DEMO_NS}/collections/`;
  if (!id.startsWith(prefix) || !id.endsWith('/Record')) return null;
  const slug = id.slice(prefix.length, -'/Record'.length);
  return slug || null;
}

export function typeDisplayLabel(type: TypeDef): string {
  if (type.label) return type.label;
  const slug = collectionSlugFromTypeId(type['@id'] ?? '');
  if (slug) return `${slug.replace(/-/g, ' ')} records`;
  return type['@id']?.split('/').pop() ?? type['@id'] ?? 'Type';
}

export function isManageableType(type: TypeDef): boolean {
  return typeKind(type) !== 'builtin';
}

export function listManageableTypes(types: TypeDef[]): TypeDef[] {
  return types.filter(isManageableType);
}

export function globalTypeId(name: string): string {
  return `https://trellis.dev/ns/user/${name.trim()}`;
}

export function fieldCountSummary(fields: TypeField[] | undefined): string {
  const count = fields?.length ?? 0;
  return count === 1 ? '1 field' : `${count} fields`;
}
