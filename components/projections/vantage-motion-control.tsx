'use client';

import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  VANTAGE_MOTION_LABELS,
  VANTAGE_MOTION_OPTIONS,
} from '@/lib/fractal/vantage-motion-types';
import { useVantageMotion } from '@/lib/fractal/vantage-motion';
import { cn } from '@/lib/utils';

export function VantageMotionControl({ className }: { className?: string }) {
  const { motion, setMotion } = useVantageMotion();

  return (
    <ButtonGroup
      data-testid="vantage-motion-control"
      role="radiogroup"
      aria-label="Vantage motion"
      className={className}
    >
      {VANTAGE_MOTION_OPTIONS.map((option) => {
        const active = motion === option;
        return (
          <Button
            key={option}
            type="button"
            variant="outline"
            size="sm"
            role="radio"
            aria-checked={active}
            aria-label={VANTAGE_MOTION_LABELS[option]}
            title={VANTAGE_MOTION_LABELS[option]}
            className={cn('px-2.5 capitalize', active && 'bg-muted text-foreground')}
            onClick={() => setMotion(option)}
          >
            {option}
          </Button>
        );
      })}
    </ButtonGroup>
  );
}
