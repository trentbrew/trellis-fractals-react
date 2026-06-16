'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Relative-positioned board container. Pointer presence is tracked globally at
 * the viewport level and remote cursors render in a single app-shell overlay
 * (see {@link PresenceCursors}), so this no longer attaches a tracking surface.
 */
export function BoardPresenceSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('relative min-h-48 touch-none', className)}>
      {children}
    </div>
  );
}
