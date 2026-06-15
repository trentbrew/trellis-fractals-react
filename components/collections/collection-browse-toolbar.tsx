'use client';

import {
  DownloadIcon,
  FilterIcon,
  PlusIcon,
  SearchIcon,
  UploadIcon,
  XIcon,
} from 'lucide-react';
import type { CollectionViewMode } from '@/lib/registry/collection-views';
import type { TypeDef } from '@/lib/trellis/use-types';
import { CollectionViewPicker } from '@/components/shell/CollectionViewPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  GridColumnCountControl,
  type GridColumnCount,
} from '@/components/projections/grid-column-count-control';
import { cn } from '@/lib/utils';
import type { SpreadsheetColumnFilter } from '@/components/boards/spreadsheet/SpreadsheetTable';
import { spreadsheetFilterSummary } from '@/components/boards/spreadsheet/SpreadsheetTable';

type CollectionBrowseToolbarProps = {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onNewRecord: () => void;
  viewMode: CollectionViewMode;
  onViewModeChange: (mode: CollectionViewMode) => void;
  typeDefinition?: Pick<TypeDef, 'fields'>;
  activeFilters?: Record<string, SpreadsheetColumnFilter>;
  filterColumns?: { key: string; label: string }[];
  onClearFilter?: (key: string) => void;
  onClearAllFilters?: () => void;
  filtersEnabled?: boolean;
  cardGridColumns?: GridColumnCount;
  onCardGridColumnsChange?: (columns: GridColumnCount) => void;
  hideViewTabs?: boolean;
  className?: string;
};

export function CollectionBrowseToolbar({
  searchQuery,
  onSearchQueryChange,
  onNewRecord,
  viewMode,
  onViewModeChange,
  typeDefinition,
  activeFilters = {},
  filterColumns = [],
  onClearFilter,
  onClearAllFilters,
  filtersEnabled = true,
  cardGridColumns,
  onCardGridColumnsChange,
  hideViewTabs = false,
  className,
}: CollectionBrowseToolbarProps) {
  const filterCount = Object.keys(activeFilters).length;
  const columnLabel = (key: string) =>
    filterColumns.find((column) => column.key === key)?.label ?? key;
  const controlHeight = 'h-8';

  return (
    <div
      className={cn(
        'sticky top-0 z-10 shrink-0 border-y border-border bg-background py-2',
        className,
      )}
      data-testid="collection-page-toolbar"
    >
      <div className="flex w-full min-w-0 items-center gap-1">
        {!hideViewTabs ? (
          <div className="flex shrink-0 items-center gap-2" aria-label="View controls">
            <CollectionViewPicker
              variant="toolbar"
              typeDefinition={typeDefinition}
              value={viewMode}
              onChange={onViewModeChange}
            />

            {viewMode === 'card-grid' && cardGridColumns != null && onCardGridColumnsChange ? (
              <GridColumnCountControl
                value={cardGridColumns}
                onChange={onCardGridColumnsChange}
              />
            ) : null}
          </div>
        ) : null}

        <div
          className={cn(
            'relative flex min-w-0 flex-1 items-center',
            controlHeight,
          )}
        >
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            className={cn(
              'border-0 bg-transparent py-0 pr-8 pl-8 text-[0.8rem] shadow-none focus-visible:ring-0 md:text-[0.8rem] dark:bg-transparent',
              controlHeight,
            )}
            placeholder="Search records…"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.currentTarget.value)}
            aria-label="Search records"
            data-testid="collection-search"
          />
          {searchQuery ? (
            <button
              type="button"
              className="absolute top-1/2 right-2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => onSearchQueryChange('')}
              aria-label="Clear search"
            >
              <XIcon className="size-3.5" />
            </button>
          ) : null}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="relative shrink-0"
                disabled={!filtersEnabled}
                aria-label={
                  filterCount > 0 ? `Filters (${filterCount} active)` : 'Filters'
                }
                data-testid="collection-filters"
              >
                <FilterIcon className="size-3.5" />
                {filterCount > 0 ? (
                  <span className="absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-medium text-primary-foreground">
                    {filterCount}
                  </span>
                ) : null}
              </Button>
            }
          />
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Active filters</DropdownMenuLabel>
              {filterCount === 0 ? (
                <DropdownMenuItem disabled>
                  {filtersEnabled
                    ? 'Use column headers in table view to filter.'
                    : 'Filters are available in table view.'}
                </DropdownMenuItem>
              ) : (
                Object.entries(activeFilters).map(([key, filter]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => onClearFilter?.(key)}
                    className="justify-between gap-2"
                  >
                    <span className="truncate">
                      <span className="text-muted-foreground">{columnLabel(key)}:</span>{' '}
                      {spreadsheetFilterSummary(filter)}
                    </span>
                    <XIcon className="size-3 shrink-0 opacity-60" />
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuGroup>
            {filterCount > 0 ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onClearAllFilters?.()}>
                  Clear all filters
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          disabled
          aria-label="Upload"
        >
          <UploadIcon className="size-3.5" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          disabled
          aria-label="Export"
        >
          <DownloadIcon className="size-3.5" />
        </Button>

        <Button
          type="button"
          size="sm"
          className={cn('ml-1 shrink-0 gap-1.5', controlHeight)}
          onClick={onNewRecord}
          data-testid="collection-new-record"
        >
          <PlusIcon className="size-3.5" />
          New record
        </Button>
      </div>
    </div>
  );
}
