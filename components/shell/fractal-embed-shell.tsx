'use client';

import { useEmbedFlags } from '@/lib/shell/use-embed-flags';
import { cn } from '@/lib/utils';

/**
 * Embed: top dock + scrollable body inside a square iframe.
 * App: bottom-fixed dock with padding reserve.
 */
export function FractalEmbedShell({
  children,
  dock,
  className,
}: {
  children: React.ReactNode;
  dock?: React.ReactNode;
  className?: string;
}) {
  const { embed } = useEmbedFlags();

  if (!embed) {
    return (
      <div className={cn('flex min-h-0 flex-1 flex-col pb-24', className)}>
        {children}
        {dock}
      </div>
    );
  }

  return (
    <div className={cn('flex h-full min-h-0 w-full flex-col overflow-hidden', className)}>
      {dock}
      <div className="flex min-h-0 flex-1 flex-col overflow-auto">{children}</div>
    </div>
  );
}
