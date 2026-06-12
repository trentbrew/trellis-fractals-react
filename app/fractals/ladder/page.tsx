'use client';

import { FractalLadderVisual } from '@/components/fractals/fractal-ladder-visual';
import { useEmbedFlags } from '@/lib/shell/use-embed-flags';

export default function FractalLadderPage() {
  const { embed } = useEmbedFlags();

  return (
    <div
      className={
        embed
          ? 'flex w-full min-w-0 flex-col gap-4'
          : 'mx-auto flex w-full max-w-2xl flex-col gap-4'
      }
    >
      {!embed ? (
        <header className="space-y-1">
          <p className="font-mono text-xs text-muted-foreground">Reference</p>
          <h1 className="text-xl font-semibold tracking-tight">Fractal ladder</h1>
        </header>
      ) : null}
      <FractalLadderVisual compact={embed} />
    </div>
  );
}
