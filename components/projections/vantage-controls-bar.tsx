'use client';

import { VantageControl } from '@/components/projections/vantage-control';
import { VantageMotionControl } from '@/components/projections/vantage-motion-control';
import {
  COLLECTION_VANTAGE_PRESETS,
  VantagePresetControl,
  type VantagePreset,
} from '@/components/projections/vantage-presets';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function VantageControlsBar({
  vantage,
  onVantageChange,
  projectionLabel,
  presets = COLLECTION_VANTAGE_PRESETS,
  showMotionControl = true,
  fullWidthSlider = false,
  className,
}: {
  vantage: number;
  onVantageChange: (value: number) => void;
  projectionLabel?: string;
  presets?: VantagePreset[];
  showMotionControl?: boolean;
  fullWidthSlider?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn('flex w-full min-w-0 flex-wrap items-center gap-2', className)}
      data-testid="vantage-controls-bar"
    >
      {projectionLabel ? (
        <Badge variant="secondary" className="shrink-0 rounded-md" data-testid="board-projection-label">
          {projectionLabel}
        </Badge>
      ) : null}
      <VantagePresetControl value={vantage} onChange={onVantageChange} presets={presets} />
      {showMotionControl ? <VantageMotionControl /> : null}
      <VantageControl
        value={vantage}
        onChange={onVantageChange}
        className={cn(
          fullWidthSlider ? 'min-w-0 w-full basis-full' : 'min-w-40 max-w-64 flex-1',
        )}
      />
    </div>
  );
}
