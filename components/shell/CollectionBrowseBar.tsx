import { ArrowDownIcon, ArrowUpIcon, ArrowUpDownIcon, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { BrowseConfig, BrowseSortDir } from '@/lib/registry/browse-config';
import type { BrowseState } from '@/lib/browse/apply';

export function CollectionBrowseBar<E extends Record<string, unknown>>({
  config,
  state,
  resultCount,
  totalCount,
  onChange,
}: {
  config: BrowseConfig<E>;
  state: BrowseState;
  resultCount?: number;
  totalCount?: number;
  onChange: (patch: Partial<BrowseState>) => void;
}) {
  const sortable = config.fields.filter((field) => field.sortable);
  const showCount = resultCount != null && totalCount != null && resultCount !== totalCount;
  const currentSort = sortable.find((field) => field.key === state.sortKey);

  return (
    <div className="flex w-full items-center gap-2" role="search">
      <div className="relative min-w-0 flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search…"
          aria-label="Search collection"
          value={state.query}
          onChange={(event) => onChange({ query: event.currentTarget.value })}
          className="w-full rounded-lg border border-border bg-card/50 py-2 pr-4 pl-10 text-sm placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
        />
      </div>

      {sortable.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" size="sm" className="gap-2 bg-card">
                <ArrowUpDownIcon className="size-4" />
                <span className="hidden sm:inline">{currentSort?.label ?? 'Sort'}</span>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuRadioGroup
              value={state.sortKey}
              onValueChange={(value) => {
                if (value) onChange({ sortKey: String(value) });
              }}
            >
              {sortable.map((field) => (
                <DropdownMenuRadioItem key={field.key} value={field.key}>
                  {field.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                onChange({ sortDir: (state.sortDir === 'asc' ? 'desc' : 'asc') as BrowseSortDir })
              }
            >
              {state.sortDir === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />}
              <span>{state.sortDir === 'asc' ? 'Ascending' : 'Descending'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {showCount && (
        <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
          {resultCount} of {totalCount}
        </span>
      )}
    </div>
  );
}
