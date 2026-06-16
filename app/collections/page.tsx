import { Suspense } from 'react';
import { CollectionsIndexRedirect } from '@/components/shell/collections-index-redirect';

export default function CollectionsPage() {
  return (
    <Suspense
      fallback={<p className="p-4 text-sm text-muted-foreground">Loading…</p>}
    >
      <CollectionsIndexRedirect />
    </Suspense>
  );
}
