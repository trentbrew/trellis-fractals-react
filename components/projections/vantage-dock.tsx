'use client';

import { useEmbedFlags } from '@/lib/shell/use-embed-flags';
import { cn } from '@/lib/utils';

export function VantageDock({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { embed } = useEmbedFlags();

  return (
    <div
      className={cn(
        'pointer-events-none z-40 flex justify-center',
        embed
          ? 'relative shrink-0 w-full px-2 pt-2'
          : 'fixed inset-x-0 bottom-0 px-4 pb-4',
        className,
      )}
      data-testid="vantage-dock"
    >
      <div
        data-vantage-dock
        className={cn(
          'pointer-events-auto flex w-full flex-wrap items-center justify-center gap-2 rounded-2xl border shadow-lg backdrop-blur-xl backdrop-saturate-150',
          'border-foreground/15 bg-foreground/[0.9] text-background',
          'dark:border-background/35 dark:bg-background/[0.92] dark:text-foreground',
          embed ? 'max-w-none rounded-lg px-2 py-1.5' : 'max-w-4xl px-3 py-2.5',
          '[&_button]:border-current/20 [&_button]:bg-current/5 [&_button[aria-checked=true]]:bg-current/15 [&_button[aria-checked=true]]:text-inherit',
        )}
      >
        {children}
      </div>
    </div>
  );
}
