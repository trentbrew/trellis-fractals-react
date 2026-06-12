'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { TagsIcon } from 'lucide-react';
import { EntityIcon } from '@/lib/icons/entity-icon';
import { useTypeAppearance, typeSchemaHref } from '@/lib/registry/type-appearance';
import {
  listManageableTypes,
  typeDisplayLabel,
  typeKind,
} from '@/lib/registry/type-utils';
import { CollectionMetaType, sortMeta, type CollectionMeta } from '@/lib/schemas/collection';
import { useCollection } from '@/lib/trellis/use-collection';
import { useTypes } from '@/lib/trellis/use-types';
import { cn } from '@/lib/utils';

function matchesSidebarQuery(text: string, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return text.toLowerCase().includes(needle);
}

export function TypesSecondary({ searchQuery = '' }: { searchQuery?: string }) {
  const pathname = usePathname();
  const { types, loading } = useTypes();
  const { rows: metaRows } = useCollection(CollectionMetaType);
  const collections = useMemo(
    () => sortMeta(metaRows as CollectionMeta[]),
    [metaRows],
  );
  const { getTypeIcon, getTypeColor } = useTypeAppearance(collections);

  const typesActive = pathname === '/collections/types' || pathname.startsWith('/collections/types?');

  const globalTypes = useMemo(
    () =>
      listManageableTypes(types).filter(
        (type) => typeKind(type) === 'global',
      ),
    [types],
  );

  const filteredTypes = useMemo(
    () =>
      globalTypes.filter((ont) => {
        const label = typeDisplayLabel(ont);
        return matchesSidebarQuery(label, searchQuery);
      }),
    [globalTypes, searchQuery],
  );

  const showManageLink = !searchQuery.trim() || matchesSidebarQuery('Manage types', searchQuery);

  return (
    <div className="mt-4 border-t border-border pt-3">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Types
      </h2>

      {showManageLink ? (
        <Link
          href="/collections/types"
          className={cn(
            'mt-2 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted',
            typesActive && 'bg-muted font-medium',
          )}
          data-testid="sidebar-manage-types"
        >
          <TagsIcon className="size-3.5 text-muted-foreground" />
          Manage types
        </Link>
      ) : null}

      {loading && globalTypes.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">Loading…</p>
      ) : filteredTypes.length === 0 ? (
        searchQuery ? (
          <p className="mt-2 text-xs text-muted-foreground">No matching types.</p>
        ) : null
      ) : (
        <ul className="mt-2 space-y-0.5">
          {filteredTypes.slice(0, 8).map((ont, index) => {
            const typeId = ont['@id'];
            const label = typeDisplayLabel(ont);
            const color = getTypeColor(ont, index);
            const icon = getTypeIcon(ont);
            const href = typeSchemaHref(ont);
            const isActive = pathname.startsWith(href.split('?')[0] ?? href);

            return (
              <li key={typeId}>
                <Link
                  href={href}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors hover:bg-muted hover:text-foreground',
                    isActive ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground',
                  )}
                  data-testid="sidebar-type-link"
                  data-type-id={typeId}
                >
                  <span
                    className="flex size-5 shrink-0 items-center justify-center rounded-md border border-border"
                    style={{ backgroundColor: `${color}22`, color }}
                    aria-hidden
                  >
                    <EntityIcon name={icon} className="size-3" />
                  </span>
                  <span className="truncate">{label}</span>
                </Link>
              </li>
            );
          })}
          {filteredTypes.length > 8 ? (
            <li>
              <Link
                href="/collections/types"
                className="block px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                +{filteredTypes.length - 8} more
              </Link>
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
}
