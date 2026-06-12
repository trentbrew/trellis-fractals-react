'use client';

import type { GridColumnCount } from '@/components/projections/grid-column-count-control';
import type { CollectionRecord } from '@/lib/schemas/collection';
import { cn } from '@/lib/utils';

function CardGridItem({ record }: { record: CollectionRecord }) {
  return (
    <article
      className="flex min-h-36 flex-col justify-end overflow-hidden rounded-lg border border-border bg-card p-5"
      data-testid="record-row"
      data-record-id={record.id}
      data-record-title={record.title ?? ''}
      data-record-body={record.body ?? ''}
    >
      <p
        className={cn(
          'font-medium text-foreground',
          record.title ? 'text-base' : 'text-sm text-muted-foreground',
        )}
      >
        {record.title || 'Untitled'}
      </p>
      {record.body ? (
        <p className="mt-2 line-clamp-4 text-sm text-muted-foreground">{record.body}</p>
      ) : null}
    </article>
  );
}

export function CollectionRecordsCardGridView({
  records,
  columns,
}: {
  records: CollectionRecord[];
  columns: GridColumnCount;
}) {
  if (records.length === 0) {
    return (
      <p className="p-4 text-sm text-muted-foreground" data-testid="collection-card-grid-empty">
        No records yet.
      </p>
    );
  }

  return (
    <div
      style={{ '--cols': columns } as React.CSSProperties}
      className="grid grid-cols-[repeat(var(--cols),1fr)] gap-4 p-4"
      data-testid="collection-card-grid-view"
    >
      {records.map((record) => (
        <CardGridItem key={record.id} record={record} />
      ))}
    </div>
  );
}
