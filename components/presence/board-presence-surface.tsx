'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useBoardPresence } from '@/lib/presence/context';
import { PresenceCursors } from '@/components/presence/presence-cursors';

export function BoardPresenceSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const presence = useBoardPresence();

  return (
    <div
      ref={presence?.attachSurface}
      className={cn('relative min-h-48 touch-none', className)}
    >
      {children}
      <PresenceCursors />
    </div>
  );
}
