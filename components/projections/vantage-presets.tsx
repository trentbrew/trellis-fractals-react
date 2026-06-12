'use client';

import {
  CircleDotIcon,
  Grid2x2Icon,
  Grid3x3Icon,
  LayoutGridIcon,
  LayoutPanelLeftIcon,
  ListIcon,
  NetworkIcon,
  Rows3Icon,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { cn } from '@/lib/utils';

export type VantagePreset = {
  id: string;
  label: string;
  value: number;
  icon: LucideIcon;
};

export const COLLECTION_VANTAGE_PRESETS: VantagePreset[] = [
  { id: 'dots', label: 'Dots', value: 1.5, icon: CircleDotIcon },
  { id: 'list', label: 'List', value: 3.5, icon: ListIcon },
  { id: 'rows', label: 'Rows', value: 6, icon: Rows3Icon },
  { id: 'dense', label: 'Dense', value: 7, icon: Grid2x2Icon },
  { id: 'tiles', label: 'Tiles', value: 8, icon: Grid3x3Icon },
  { id: 'cards', label: 'Cards', value: 9, icon: LayoutGridIcon },
];

export const PAGE_VANTAGE_PRESETS: VantagePreset[] = [
  { id: 'graph', label: 'Graph', value: 1, icon: NetworkIcon },
  { id: 'outline', label: 'Outline', value: 5, icon: ListIcon },
  { id: 'layout', label: 'Layout', value: 11, icon: LayoutPanelLeftIcon },
];

export function VantagePresetControl({
  value,
  onChange,
  presets = COLLECTION_VANTAGE_PRESETS,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  presets?: VantagePreset[];
  className?: string;
}) {
  return (
    <ButtonGroup
      data-testid="vantage-presets"
      role="radiogroup"
      aria-label="Vantage presets"
      className={className}
    >
      {presets.map((preset) => {
        const Icon = preset.icon;
        const active = Math.abs(value - preset.value) < 0.05;
        return (
          <Button
            key={preset.id}
            type="button"
            variant="outline"
            size="sm"
            role="radio"
            aria-checked={active}
            aria-label={`${preset.label} preset`}
            title={`${preset.label} - vantage ${preset.value.toFixed(1)}`}
            className={cn('px-2', active && 'bg-muted text-foreground')}
            onClick={() => onChange(preset.value)}
          >
            <Icon data-icon="inline-start" className="size-3.5" />
            <span className="hidden xl:inline">{preset.label}</span>
          </Button>
        );
      })}
    </ButtonGroup>
  );
}
