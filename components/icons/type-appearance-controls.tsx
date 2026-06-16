'use client';

import { useState } from 'react';
import { EntityIcon } from '@/lib/icons/entity-icon';
import { LucideIconPicker } from '@/components/icons/lucide-icon-picker';
import { cn } from '@/lib/utils';

type TypeAppearanceControlsProps = {
  icon: string;
  color: string;
  label: string;
  onIconChange: (icon: string) => void;
  onColorChange: (color: string) => void;
  size?: 'sm' | 'md' | 'lg';
  iconButtonTestId?: string;
  className?: string;
};

const SIZE_CLASSES = {
  sm: {
    iconButton: 'size-5',
    icon: 'size-3',
  },
  md: {
    iconButton: 'size-8',
    icon: 'size-4',
  },
  lg: {
    iconButton: 'size-10',
    icon: 'size-5',
  },
} as const;

export function TypeAppearanceControls({
  icon,
  color,
  label,
  onIconChange,
  onColorChange,
  size = 'md',
  iconButtonTestId,
  className,
}: TypeAppearanceControlsProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const sizes = SIZE_CLASSES[size];

  return (
    <>
      <button
        type="button"
        className={cn(
          'flex shrink-0 items-center justify-center rounded-md border border-border transition-colors hover:bg-muted',
          sizes.iconButton,
          className,
        )}
        style={{ backgroundColor: `${color}22`, color }}
        aria-label={`Appearance for ${label}`}
        onClick={() => setPickerOpen(true)}
        data-testid={iconButtonTestId}
      >
        <EntityIcon name={icon} className={sizes.icon} />
      </button>

      <LucideIconPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        value={icon}
        onSelect={onIconChange}
        color={color}
        onColorChange={onColorChange}
      />
    </>
  );
}
