import Link from 'next/link';
import {
  CalendarIcon,
  GanttChartIcon,
  LayoutDashboardIcon,
  LayoutGridIcon,
  ListIcon,
  TableIcon,
  type LucideIcon,
} from 'lucide-react';
import type { AnyType } from 'trellis/schema';
import { cn } from '@/lib/utils';
import { suggestCollectionViews, type CollectionViewMode } from '@/lib/registry/collection-views';
import { corpusViewHref } from '@/lib/registry/view-routes';

const VIEW_ICONS: Record<CollectionViewMode, LucideIcon> = {
  table: TableIcon,
  kanban: LayoutDashboardIcon,
  calendar: CalendarIcon,
  gantt: GanttChartIcon,
  list: ListIcon,
  'card-grid': LayoutGridIcon,
};

/** Segmented view-mode switcher, styled after the Nodebook browse toolbar. */
export function CollectionViewHint({
  schema,
  current,
}: {
  schema: AnyType;
  current?: CollectionViewMode;
}) {
  const views = suggestCollectionViews(schema).filter((view) => view.supported);

  return (
    <div
      className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-card/0 p-0.5 backdrop-blur-lg"
      aria-label="Switch view"
    >
      {views.map((view) => {
        const Icon = VIEW_ICONS[view.mode];
        const isCurrent = view.mode === current;
        const itemClass = cn(
          'flex h-8 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors',
          isCurrent
            ? 'bg-foreground/8 text-foreground'
            : 'text-muted-foreground/50 hover:bg-transparent hover:text-foreground',
        );

        if (isCurrent) {
          return (
            <span key={view.mode} className={itemClass} title={view.label}>
              <Icon className="size-4" />
              <span className="hidden sm:inline">{view.label}</span>
            </span>
          );
        }

        const href = corpusViewHref(schema, view.mode);
        return (
          <Link key={view.mode} href={href ?? '#'} className={itemClass} title={view.label}>
            <Icon className="size-4" />
          </Link>
        );
      })}
    </div>
  );
}
