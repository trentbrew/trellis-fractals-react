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
import { ButtonGroup } from '@/components/ui/button-group';
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
  className,
}: CollectionBrowseToolbarProps) {
  const filterCount = Object.keys(activeFilters).length;
  const columnLabel = (key: string) =>
    filterColumns.find((column) => column.key === key)?.label ?? key;

  return (
    <div
      className={cn(
        'sticky top-0 z-10 shrink-0 border-b border-border bg-background py-2',
        className,
      )}
      data-testid="collection-page-toolbar"
    >
      <div className="flex w-full min-w-0 items-center gap-2">
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

        <ButtonGroup
          className="min-w-0 flex-1 basis-0"
          aria-label="Search and filters"
        >
          <div
            data-slot="input"
            className="relative flex h-7 min-w-0 flex-1 items-center rounded-lg rounded-r-none border border-input bg-background dark:bg-background"
          >
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              className="h-7 border-0 bg-transparent py-0 pr-8 pl-8 text-[0.8rem] shadow-none focus-visible:ring-0 md:text-[0.8rem] dark:bg-transparent"
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
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={!filtersEnabled}
                  data-testid="collection-filters"
                >
                  <FilterIcon className="size-3.5" />
                  Filters
                  {filterCount > 0 ? (
                    <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
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
        </ButtonGroup>

        <ButtonGroup className="shrink-0" aria-label="Record actions">
          <ButtonGroup>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled>
              <UploadIcon className="size-3.5" />
              Upload
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled>
              <DownloadIcon className="size-3.5" />
              Export
            </Button>
          </ButtonGroup>

          <ButtonGroup>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={onNewRecord}
              data-testid="collection-new-record"
            >
              <PlusIcon className="size-3.5" />
              New record
            </Button>
          </ButtonGroup>
        </ButtonGroup>
      </div>
    </div>
  );
}
