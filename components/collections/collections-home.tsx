'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { TypeAppearanceControls } from '@/components/icons/type-appearance-controls';
import { resolveCollectionType } from '@/lib/registry/type-columns';
import { useTypeAppearance } from '@/lib/registry/type-appearance';
import { useCollection } from '@/lib/trellis/use-collection';
import { useTypes } from '@/lib/trellis/use-types';
import {
  CollectionMetaType,
  sortMeta,
  type CollectionMeta,
} from '@/lib/schemas/collection';

export function CollectionsHome() {
  const { rows, loading, error, mut } = useCollection(CollectionMetaType);
  const { types } = useTypes();
  const sorted = useMemo(() => sortMeta(rows as CollectionMeta[]), [rows]);
  const { getTypeIcon, getTypeColor, trySetTypeAppearance } =
    useTypeAppearance(sorted);

  async function updateCollectionAppearance(
    collection: CollectionMeta,
    type: ReturnType<typeof resolveCollectionType>,
    updates: { icon?: string; color?: string },
  ) {
    const saved = await trySetTypeAppearance(type, updates);
    if (saved) return;

    const metaUpdates: Partial<Pick<CollectionMeta, 'icon' | 'color'>> = {};
    if (updates.icon !== undefined && updates.icon !== collection.icon) {
      metaUpdates.icon = updates.icon;
    }
    if (updates.color !== undefined && updates.color !== collection.color) {
      metaUpdates.color = updates.color;
    }
    if (Object.keys(metaUpdates).length > 0) {
      await mut.update(collection.id, metaUpdates);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6" data-testid="collections-home">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Collections</h1>
        <p className="text-sm text-muted-foreground">
          Named tables with live records — graph-discovered via{' '}
          <code className="rounded bg-muted px-1 text-xs">CollectionMeta</code>.
        </p>
      </header>

      {error && (
        <p className="text-sm text-destructive">
          Sidecar unavailable — start Trellis on port 8230.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading collections…</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No collections yet — create one in the sidebar.
        </p>
      ) : (
        <ul
          className="grid gap-4 sm:grid-cols-2"
          data-testid="collection-grid"
        >
          {sorted.map((collection, index) => {
            const type = resolveCollectionType(types, collection.slug);
            const icon = getTypeIcon(type);
            const color = getTypeColor(type, index);

            return (
              <li key={collection.id}>
                <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50">
                  <TypeAppearanceControls
                    icon={icon}
                    color={color}
                    label={collection.title}
                    onIconChange={(next) =>
                      void updateCollectionAppearance(collection, type, { icon: next })
                    }
                    onColorChange={(next) =>
                      void updateCollectionAppearance(collection, type, { color: next })
                    }
                    iconButtonTestId="collection-card-icon-picker-trigger"
                  />
                  <Link
                    href={`/collections/${collection.slug}`}
                    data-testid="collection-card"
                    data-slug={collection.slug}
                    className="min-w-0 flex-1"
                  >
                    <h2 className="font-medium">{collection.title}</h2>
                    {collection.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {collection.description}
                      </p>
                    )}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
