'use client';

import type { AnyType } from 'trellis/schema';
import { cn } from '@/lib/utils';
import {
  eligibleCollectionViews,
  eligibleCollectionViewsFromDefinition,
  suggestDefaultCollectionView,
  suggestDefaultCollectionViewFromDefinition,
  type CollectionViewMode,
} from '@/lib/registry/collection-views';
import { VIEW_ICONS } from '@/lib/registry/view-icons';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type TypeDefinitionLike = {
  fields?: { name: string; valueType?: string }[];
};

export function CollectionViewPicker({
  schema,
  typeDefinition,
  value,
  onChange,
  variant = 'sidebar',
  className,
}: {
  schema?: AnyType;
  typeDefinition?: TypeDefinitionLike;
  value?: CollectionViewMode;
  onChange?: (mode: CollectionViewMode) => void;
  variant?: 'sidebar' | 'toolbar';
  className?: string;
}) {
  const eligible = typeDefinition
    ? eligibleCollectionViewsFromDefinition(typeDefinition)
    : eligibleCollectionViews(schema!);
  const defaultMode = typeDefinition
    ? suggestDefaultCollectionViewFromDefinition(typeDefinition)
    : suggestDefaultCollectionView(schema!);
  const active = value ?? defaultMode;

  if (variant === 'toolbar') {
    return (
      <Tabs
        value={active}
        onValueChange={(mode) => onChange?.(mode as CollectionViewMode)}
        className={cn('shrink-0', className)}
      >
        <TabsList
          data-testid="collection-view-picker"
          role="radiogroup"
          aria-label="Collection view"
          className="h-8 gap-0 rounded-lg border border-border bg-background p-0.5 text-foreground shadow-none"
        >
          {eligible.map((option) => {
            const Icon = VIEW_ICONS[option.mode];
            const isActive = active === option.mode;
            return (
              <TabsTrigger
                key={option.mode}
                value={option.mode}
                role="radio"
                aria-checked={isActive}
                aria-label={option.label}
                data-view={option.mode}
                title={option.reason ?? option.label}
                className="flex-none gap-1.5 rounded-md px-2 text-xs text-muted-foreground shadow-none hover:bg-muted hover:text-foreground data-active:bg-muted data-active:text-foreground dark:data-active:bg-muted dark:data-active:text-foreground"
              >
                <Icon className="size-3.5 shrink-0" />
                {isActive ? (
                  <span className="whitespace-nowrap">{option.label}</span>
                ) : null}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    );
  }

  return (
    <div data-testid="collection-view-picker" className="space-y-2">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        View
      </span>
      <div
        className="flex flex-wrap gap-1"
        role="radiogroup"
        aria-label="Collection view"
      >
        {eligible.map((option) => {
          const Icon = VIEW_ICONS[option.mode];
          return (
            <button
              key={option.mode}
              type="button"
              role="radio"
              aria-checked={active === option.mode}
              aria-label={option.label}
              data-view={option.mode}
              title={option.reason}
              className={cn(
                'flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs transition-colors',
                active === option.mode
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              )}
              onClick={() => onChange?.(option.mode)}
            >
              <Icon className="size-3 shrink-0" />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
