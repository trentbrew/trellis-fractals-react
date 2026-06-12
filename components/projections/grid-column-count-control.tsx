'use client';

import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { cn } from '@/lib/utils';

export const GRID_COLUMN_OPTIONS = [3, 4, 5] as const;
export type GridColumnCount = (typeof GRID_COLUMN_OPTIONS)[number];
export const DEFAULT_GRID_COLUMN_COUNT: GridColumnCount = 4;

type GridColumnCountControlProps = {
  value: GridColumnCount;
  onChange: (columns: GridColumnCount) => void;
  className?: string;
};

export function GridColumnCountControl({
  value,
  onChange,
  className,
}: GridColumnCountControlProps) {
  return (
    <ButtonGroup
      data-testid="grid-column-count-control"
      role="radiogroup"
      aria-label="Grid columns"
      className={className}
    >
      {GRID_COLUMN_OPTIONS.map((option) => {
        const isActive = value === option;
        return (
          <Button
            key={option}
            type="button"
            variant="outline"
            size="sm"
            role="radio"
            aria-checked={isActive}
            aria-label={`${option} columns`}
            className={cn('min-w-7 px-2', isActive && 'bg-muted text-foreground')}
            onClick={() => onChange(option)}
          >
            {option}
          </Button>
        );
      })}
    </ButtonGroup>
  );
}
