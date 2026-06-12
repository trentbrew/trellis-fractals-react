import { Suspense } from 'react';
import { TypesHome } from '@/components/collections/types-home';

export default function CollectionTypesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading types…</p>}>
      <TypesHome />
    </Suspense>
  );
}
