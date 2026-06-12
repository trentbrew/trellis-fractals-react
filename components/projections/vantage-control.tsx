'use client';

import {
  VANTAGE_MAX,
  VANTAGE_MIN,
} from '@/lib/fractal/vantage';
import { cn } from '@/lib/utils';

type VantageControlProps = {
  value: number;
  onChange: (value: number) => void;
  className?: string;
};

export function VantageControl({ value, onChange, className }: VantageControlProps) {
  return (
    <label
      className={cn(
        'flex min-w-[min(100%,18rem)] items-center gap-3 text-sm',
        className,
      )}
      data-testid="vantage-control"
    >
      <span className="w-8 shrink-0 text-right font-mono text-xs text-muted-foreground">
        {value.toFixed(1)}
      </span>
      <input
        className="w-full accent-foreground"
        type="range"
        min={VANTAGE_MIN}
        max={VANTAGE_MAX}
        step={0.1}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  );
}
