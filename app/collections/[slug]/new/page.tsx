import { Suspense } from 'react';
import { CollectionNewRecordPage } from '@/components/collections/collection-new-record-page';

export default async function CollectionNewRecordRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <Suspense fallback={<p className="px-4 py-8 text-sm text-muted-foreground">Loading…</p>}>
      <CollectionNewRecordPage slug={slug} />
    </Suspense>
  );
}
