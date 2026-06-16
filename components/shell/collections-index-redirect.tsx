'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CollectionsHome } from '@/components/collections/collections-home';
import { hrefWithSearchParams } from '@/lib/shell/preserve-query';
import { CollectionMetaType, sortMeta, type CollectionMeta } from '@/lib/schemas/collection';
import { useCollection } from '@/lib/trellis/use-collection';

export function CollectionsIndexRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { rows, loading } = useCollection(CollectionMetaType);
  const sorted = useMemo(() => sortMeta(rows as CollectionMeta[]), [rows]);
  const first = sorted[0];

  useEffect(() => {
    if (loading || !first) return;
    router.replace(hrefWithSearchParams(`/collections/${first.slug}`, searchParams));
  }, [first, loading, router, searchParams]);

  if (loading || first) {
    return <p className="p-4 text-sm text-muted-foreground">Loading…</p>;
  }

  return <CollectionsHome />;
}
