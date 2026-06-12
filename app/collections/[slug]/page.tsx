import { Suspense } from 'react';
import { CollectionRecordsProjection } from '@/components/collections/collection-records-projection';

export default async function CollectionSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <CollectionRecordsProjection slug={slug} />
    </Suspense>
  );
}
