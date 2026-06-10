import Link from 'next/link';
import type { Metadata } from 'next';
import {
  corpusCollectionHref,
  getCorpusType,
  listCorpusTypes,
  resolveCollectionMount,
} from '@/lib/registry/corpus-registry';
import type { CollectionViewMode } from '@/lib/registry/collection-views';
import { TodoBoard } from '@/components/boards/todos/TodoBoard';
import { GridBoard } from '@/components/boards/grid/GridBoard';
import { TableBoard } from '@/components/boards/table/TableBoard';
import { KanbanBoard } from '@/components/boards/kanban/KanbanBoard';
import { CalendarBoard } from '@/components/boards/calendar/CalendarBoard';
import { GanttBoard } from '@/components/boards/gantt/GanttBoard';

type CollectionSearchParams = { type?: string; view?: string };

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<CollectionSearchParams>;
}): Promise<Metadata> {
  const { type } = await searchParams;
  const entry = type ? getCorpusType(type) : undefined;
  return { title: entry ? `${entry.label} · fractals-playground` : 'Collection · fractals-playground' };
}

function CollectionError({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div role="alert" className="mx-auto mt-8 max-w-md rounded-lg border border-border bg-card p-5 text-card-foreground">
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      <div className="space-y-3 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

function CorpusTypeList() {
  return (
    <ul className="space-y-1.5">
      {listCorpusTypes().map((corpus) => (
        <li key={corpus.typeName}>
          <Link href={corpusCollectionHref(corpus.typeName)} className="text-primary underline-offset-2 hover:underline">
            {corpus.label}
          </Link>{' '}
          <span className="text-xs opacity-60">({corpus.typeName})</span>
        </li>
      ))}
    </ul>
  );
}

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<CollectionSearchParams>;
}) {
  const { type: typeParam, view: viewParam } = await searchParams;

  if (!typeParam) {
    return (
      <CollectionError title="Choose a corpus type">
        <p>
          Add <code className="rounded bg-muted px-1 py-0.5 text-xs">?type=</code> to the URL. Seeded types:
        </p>
        <CorpusTypeList />
      </CollectionError>
    );
  }

  const entry = getCorpusType(typeParam);
  if (!entry) {
    return (
      <CollectionError title={`Unknown type: ${typeParam}`}>
        <p>Valid corpus types:</p>
        <CorpusTypeList />
      </CollectionError>
    );
  }

  const view = (viewParam as CollectionViewMode | null) ?? entry.defaultView;
  const mountCheck = resolveCollectionMount(entry.typeName, view);

  if (!mountCheck.supported) {
    return (
      <CollectionError title="View not supported">
        <p>
          <strong className="text-foreground">{entry.label}</strong> cannot use{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">{view}</code>
          {mountCheck.reason ? ` — ${mountCheck.reason}` : null}
        </p>
        <p>
          <Link href={corpusCollectionHref(entry.typeName)} className="text-primary underline-offset-2 hover:underline">
            Open default ({entry.defaultView})
          </Link>
        </p>
      </CollectionError>
    );
  }

  switch (view) {
    case 'list':
      return <TodoBoard />;
    case 'table':
      return <TableBoard />;
    case 'kanban':
      return <KanbanBoard />;
    case 'calendar':
      return <CalendarBoard />;
    case 'gantt':
      return <GanttBoard />;
    case 'card-grid':
      return <GridBoard />;
    default:
      return null;
  }
}
