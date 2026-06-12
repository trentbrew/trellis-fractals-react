'use client';

import { useCallback, useMemo } from 'react';
import { DEFAULT_LUCIDE_ICON } from '@/lib/icons/lucide-icons';
import { TYPE_COLOR_PRESETS, useTypeColors } from '@/lib/icons/type-colors';
import type { CollectionMeta } from '@/lib/schemas/collection';
import type { TypeDef } from '@/lib/trellis/use-types';
import { useTypes } from '@/lib/trellis/use-types';
import { collectionSlugFromTypeId } from '@/lib/registry/type-utils';

export function resolveTypeIcon(
  type: TypeDef,
  collectionBySlug?: Map<string, CollectionMeta>,
): string {
  if (type.icon) return type.icon;
  const slug = collectionSlugFromTypeId(type['@id'] ?? '');
  if (slug && collectionBySlug?.get(slug)?.icon) {
    return collectionBySlug.get(slug)!.icon!;
  }
  return DEFAULT_LUCIDE_ICON;
}

export function resolveTypeColor(
  type: TypeDef,
  fallbackIndex: number,
  legacyColors: Record<string, string>,
  collectionBySlug?: Map<string, CollectionMeta>,
): string {
  if (type.color) return type.color;
  const typeId = type['@id'] ?? '';
  const slug = collectionSlugFromTypeId(typeId);
  if (slug && collectionBySlug?.get(slug)?.color) {
    return collectionBySlug.get(slug)!.color!;
  }
  return legacyColors[typeId] ?? TYPE_COLOR_PRESETS[fallbackIndex % TYPE_COLOR_PRESETS.length];
}

export function typeSchemaHref(type: TypeDef): string {
  const typeId = type['@id'] ?? '';
  const slug = collectionSlugFromTypeId(typeId);
  if (slug) {
    return `/collections/${slug}?configure=schema`;
  }
  return `/collections/types?type=${encodeURIComponent(typeId)}`;
}

/** Read/write type icon and color — type first, with collection-meta and localStorage fallbacks. */
export function useTypeAppearance(collections: CollectionMeta[] = []) {
  const { updateType } = useTypes();
  const { colors: legacyColors, setTypeColor: setLegacyTypeColor } = useTypeColors();

  const collectionBySlug = useMemo(
    () => new Map(collections.map((collection) => [collection.slug, collection])),
    [collections],
  );

  const getTypeIcon = useCallback(
    (type: TypeDef) => resolveTypeIcon(type, collectionBySlug),
    [collectionBySlug],
  );

  const getTypeColor = useCallback(
    (type: TypeDef, fallbackIndex = 0) =>
      resolveTypeColor(type, fallbackIndex, legacyColors, collectionBySlug),
    [legacyColors, collectionBySlug],
  );

  const setTypeColor = useCallback(
    async (type: TypeDef, color: string) => {
      const typeId = type['@id'];
      try {
        await updateType(typeId, { color });
      } catch {
        setLegacyTypeColor(typeId, color);
      }
    },
    [updateType, setLegacyTypeColor],
  );

  const setTypeIcon = useCallback(
    async (type: TypeDef, icon: string) => {
      await updateType(type['@id'], { icon });
    },
    [updateType],
  );

  /** Persist icon/color to type; returns false when type PATCH is unavailable. */
  const trySetTypeAppearance = useCallback(
    async (
      type: TypeDef,
      updates: Partial<Pick<TypeDef, 'icon' | 'color'>>,
    ): Promise<boolean> => {
      try {
        await updateType(type['@id'], updates);
        return true;
      } catch {
        return false;
      }
    },
    [updateType],
  );

  return {
    getTypeIcon,
    getTypeColor,
    setTypeColor,
    setTypeIcon,
    trySetTypeAppearance,
    collectionBySlug,
  };
}
