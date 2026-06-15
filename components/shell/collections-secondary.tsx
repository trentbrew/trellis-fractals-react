'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, Suspense } from 'react';
import { PlusIcon, SearchIcon, XIcon } from 'lucide-react';
import { EntityIcon } from '@/lib/icons/entity-icon';
import { DEFAULT_LUCIDE_ICON } from '@/lib/icons/lucide-icons';
import { resolveCollectionType } from '@/lib/registry/type-columns';
import { useTypeAppearance } from '@/lib/registry/type-appearance';
import { useCollection } from '@/lib/trellis/use-collection';
import { useTypes } from '@/lib/trellis/use-types';
import {
  CollectionMetaType,
  sortMeta,
  type CollectionMeta,
} from '@/lib/schemas/collection';
import { useShell } from '@/lib/shell/shell-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SidebarCollapsibleSection } from './sidebar-collapsible-section';
import { TypesSecondary } from './types-secondary';

function nextUntitledMeta(existing: CollectionMeta[]): { title: string; slug: string } {
  const baseTitle = 'Untitled collection';
  const baseSlug = 'untitled-collection';
  if (!existing.some((item) => item.slug === baseSlug)) {
    return { title: baseTitle, slug: baseSlug };
  }
  let index = 2;
  while (existing.some((item) => item.slug === `${baseSlug}-${index}`)) {
    index += 1;
  }
  return {
    title: `${baseTitle} ${index}`,
    slug: `${baseSlug}-${index}`,
  };
}

function matchesSidebarQuery(text: string, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return text.toLowerCase().includes(needle);
}

export function CollectionsSecondary() {
  const { collectionSlug } = useShell();
  const { types } = useTypes();
  const { rows, mut, loading } = useCollection(CollectionMetaType);
  const sorted = useMemo(() => sortMeta(rows as CollectionMeta[]), [rows]);
  const { getTypeIcon, getTypeColor } = useTypeAppearance(sorted);
  const [sidebarQuery, setSidebarQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(true);
  const [typesOpen, setTypesOpen] = useState(true);

  useEffect(() => {
    if (sidebarQuery.trim()) {
      setCollectionsOpen(true);
      setTypesOpen(true);
    }
  }, [sidebarQuery]);

  const filteredCollections = useMemo(
    () => sorted.filter((collection) => matchesSidebarQuery(collection.title, sidebarQuery)),
    [sorted, sidebarQuery],
  );

  async function addCollection() {
    if (creating) return;
    setCreating(true);
    try {
      const { title, slug } = nextUntitledMeta(sorted);
      await mut.create({
        title,
        slug,
        icon: DEFAULT_LUCIDE_ICON,
        sortOrder: sorted.length,
        color: '#0f62fe',
      });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex h-full min-h-full flex-1 flex-col">
      <div className="flex h-12 shrink-0 items-center border-b border-border px-3">
        <div className="relative w-full">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            className="h-8 w-full rounded-md border-0 bg-transparent pr-8 pl-8 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
            placeholder="Search collections & types…"
            value={sidebarQuery}
            onChange={(event) => setSidebarQuery(event.currentTarget.value)}
            aria-label="Search collections and types"
            data-testid="sidebar-search"
          />
          {sidebarQuery && (
            <button
              type="button"
              className="absolute top-1/2 right-2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setSidebarQuery('')}
              aria-label="Clear sidebar search"
            >
              <XIcon className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <SidebarCollapsibleSection
          title="Collections"
          open={collectionsOpen}
          onOpenChange={setCollectionsOpen}
          testId="sidebar-collections-section"
        >
          {loading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : filteredCollections.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {sidebarQuery ? 'No matching collections.' : 'No collections yet.'}
            </p>
          ) : (
            <ul className="space-y-0.5">
              {filteredCollections.map((collection, index) => {
                const href = `/collections/${collection.slug}`;
                const isActive = collectionSlug === collection.slug;
                const type = resolveCollectionType(types, collection.slug);
                const icon = getTypeIcon(type);
                const color = getTypeColor(type, index);
                return (
                  <li key={collection.id}>
                    <Link
                      href={href}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted',
                        isActive && 'bg-muted font-medium',
                      )}
                    >
                      <span
                        className="flex size-5 shrink-0 items-center justify-center rounded-md border border-border"
                        style={{ backgroundColor: `${color}22`, color }}
                        aria-hidden
                      >
                        <EntityIcon name={icon} className="size-3" />
                      </span>
                      <span className="truncate">{collection.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </SidebarCollapsibleSection>

        <Suspense fallback={null}>
          <TypesSecondary
            searchQuery={sidebarQuery}
            open={typesOpen}
            onOpenChange={setTypesOpen}
          />
        </Suspense>
      </div>

      <div className="shrink-0 border-t border-border p-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-1.5"
          disabled={creating}
          onClick={() => void addCollection()}
          aria-label="New collection"
          data-testid="sidebar-add-collection"
        >
          <PlusIcon className="size-3.5" />
          New collection
        </Button>
      </div>
    </div>
  );
}
