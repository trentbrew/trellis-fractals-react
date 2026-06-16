'use client';

import { useMemo } from 'react';
import { useCollection } from '@/lib/trellis/use-collection';
import {
  CollectionMetaType,
  CollectionRecordType,
  sortMeta,
  sortRecords,
  type CollectionMeta,
  type CollectionRecord,
} from '@/lib/schemas/collection';

export function useCollectionBySlug(slug: string) {
  const { rows: metaRows, loading: metaLoading, error: metaError } =
    useCollection(CollectionMetaType);
  const meta = useMemo(() => {
    const sorted = sortMeta(metaRows as CollectionMeta[]);
    return sorted.find((item) => item.slug === slug) ?? null;
  }, [metaRows, slug]);

  const {
    rows: recordRows,
    mut,
    loading: recordsLoading,
    error: recordsError,
  } = useCollection(CollectionRecordType, {
    where: meta ? { collectionId: meta.id } : undefined,
  });

  const records = useMemo(
    () => sortRecords(recordRows as CollectionRecord[]),
    [recordRows],
  );

  return {
    meta,
    records,
    mut,
    loading: metaLoading || recordsLoading,
    error: metaError ?? recordsError,
  };
}
