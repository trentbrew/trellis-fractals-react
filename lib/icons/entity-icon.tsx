'use client';

import { DynamicIcon } from 'lucide-react/dynamic';
import { FolderIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { normalizeLucideIconName } from '@/lib/icons/lucide-icons';

type EntityIconProps = {
  name?: string;
  className?: string;
};

export function EntityIcon({ name, className }: EntityIconProps) {
  const iconName = normalizeLucideIconName(name);

  return (
    <DynamicIcon
      name={iconName}
      fallback={() => <FolderIcon className={cn('shrink-0', className)} />}
      className={cn('shrink-0', className)}
      aria-hidden
    />
  );
}
