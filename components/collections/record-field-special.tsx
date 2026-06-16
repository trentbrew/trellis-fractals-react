'use client';

import { useState } from 'react';
import { ColorPicker } from '@/components/ui/color-picker';
import { LucideIconPicker } from '@/components/icons/lucide-icon-picker';
import { EntityIcon } from '@/lib/icons/entity-icon';
import { TYPE_COLOR_PRESETS } from '@/lib/icons/type-colors';
import {
  normalizeRecordColorValue,
  normalizeRecordIconValue,
  recordColorDisplay,
  recordIconDisplay,
} from '@/lib/record-field-utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type ColorFieldControlProps = {
  value?: unknown;
  onChange: (value: string | undefined) => void;
  className?: string;
  compact?: boolean;
  'data-testid'?: string;
};

export function ColorFieldControl({
  value,
  onChange,
  className,
  compact = false,
  'data-testid': testId,
}: ColorFieldControlProps) {
  const [open, setOpen] = useState(false);
  const color = recordColorDisplay(value) || '#525252';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        data-testid={testId}
        className={cn(
          'inline-flex min-w-0 items-center gap-2 text-left',
          compact
            ? 'h-full w-full px-2 text-xs hover:bg-muted'
            : 'h-9 w-full rounded-md border border-input px-2 text-sm hover:bg-muted',
          className,
        )}
      >
        <span
          className={cn('shrink-0 rounded-full border border-border', compact ? 'size-3.5' : 'size-4')}
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <span className="truncate font-mono text-muted-foreground">{color}</span>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <ColorPicker
          value={color}
          presets={TYPE_COLOR_PRESETS}
          onChange={(next) => {
            onChange(normalizeRecordColorValue(next));
          }}
        />
        <button
          type="button"
          className="mt-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            onChange(undefined);
            setOpen(false);
          }}
        >
          Clear color
        </button>
      </PopoverContent>
    </Popover>
  );
}

type IconFieldControlProps = {
  value?: unknown;
  onChange: (value: string | undefined) => void;
  className?: string;
  compact?: boolean;
  'data-testid'?: string;
};

export function IconFieldControl({
  value,
  onChange,
  className,
  compact = false,
  'data-testid': testId,
}: IconFieldControlProps) {
  const [open, setOpen] = useState(false);
  const icon = recordIconDisplay(value) || 'folder';

  return (
    <>
      <button
        type="button"
        data-testid={testId}
        className={cn(
          compact
            ? 'flex h-full w-full min-w-0 items-center gap-2 px-2 text-left text-xs hover:bg-muted'
            : 'flex h-9 w-full items-center gap-2 rounded-md border border-input px-2 text-sm hover:bg-muted',
          className,
        )}
        onClick={() => setOpen(true)}
      >
        <EntityIcon name={icon} className={compact ? 'size-3.5' : 'size-4'} />
        <span className="truncate">{icon}</span>
      </button>

      <LucideIconPicker
        open={open}
        onOpenChange={setOpen}
        value={icon}
        onSelect={(next) => {
          onChange(normalizeRecordIconValue(next));
          setOpen(false);
        }}
      />
    </>
  );
}
