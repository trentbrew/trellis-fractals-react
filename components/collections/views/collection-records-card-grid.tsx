'use client';

import { motion } from 'framer-motion';
import type { GridColumnCount } from '@/components/projections/grid-column-count-control';
import type { CollectionRecord } from '@/lib/schemas/collection';
import { htmlToPlainText } from '@/lib/links/trellis-mention';
import { cn } from '@/lib/utils';

function CardGridItem({
  record,
  morphLayoutId,
  onOpen,
}: {
  record: CollectionRecord;
  morphLayoutId?: string;
  onOpen?: (record: CollectionRecord) => void;
}) {
  const bodyText = htmlToPlainText(record.body);
  const interactive = Boolean(onOpen);
  const Article = morphLayoutId ? motion.article : 'article';

  return (
    <Article
      {...(morphLayoutId ? { layoutId: morphLayoutId } : {})}
      className={cn(
        'flex min-h-36 flex-col justify-end overflow-hidden rounded-lg border border-border bg-card p-5',
        interactive && 'cursor-pointer transition-colors hover:bg-muted/40',
      )}
      data-testid="record-row"
      data-record-id={record.id}
      data-record-title={record.title ?? ''}
      data-record-body={bodyText}
      onClick={interactive ? () => onOpen?.(record) : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onOpen?.(record);
              }
            }
          : undefined
      }
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      <p
        className={cn(
          'font-medium text-foreground',
          record.title ? 'text-base' : 'text-sm text-muted-foreground',
        )}
      >
        {record.title || 'Untitled'}
      </p>
      {bodyText ? (
        <p className="mt-2 line-clamp-4 text-sm text-muted-foreground">{bodyText}</p>
      ) : null}
    </Article>
  );
}

export function CollectionRecordsCardGridView({
  records,
  columns,
  focusRecordId,
  onOpenRecord,
}: {
  records: CollectionRecord[];
  columns: GridColumnCount;
  focusRecordId?: string | null;
  onOpenRecord?: (record: CollectionRecord) => void;
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
        <CardGridItem
          key={record.id}
          record={record}
          morphLayoutId={
            onOpenRecord && focusRecordId !== record.id ? `record-${record.id}` : undefined
          }
          onOpen={onOpenRecord}
        />
      ))}
    </div>
  );
}
