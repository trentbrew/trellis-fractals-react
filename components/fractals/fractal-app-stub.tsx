'use client';

import { useEmbedFlags } from '@/lib/shell/use-embed-flags';

export function FractalAppStub() {
  const { embed } = useEmbedFlags();

  return (
    <div className={embed ? 'flex min-h-0 flex-1 flex-col' : 'mx-auto flex w-full max-w-3xl flex-col gap-4'}>
      {!embed ? (
        <header className="space-y-2">
          <p className="font-mono text-xs text-muted-foreground">04 / containment</p>
          <h1 className="text-2xl font-semibold tracking-tight">App</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Stub for the fourth-wall demo: the product shell as a representable object that can
            collapse from app → panel → card → badge → dot.
          </p>
        </header>
      ) : null}
      <section
        className={
          embed
            ? 'min-h-[18rem] flex-1 rounded-lg border border-border bg-card p-2'
            : 'rounded-lg border border-dashed border-border bg-muted/15 p-5'
        }
      >
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex h-8 items-center gap-2 border-b border-border px-3">
            <span className="size-2 rounded-full bg-muted-foreground/50" />
            <span className="size-2 rounded-full bg-muted-foreground/35" />
            <span className="size-2 rounded-full bg-muted-foreground/20" />
            <span className="ml-1 text-[10px] text-muted-foreground">AppShell · future vantage target</span>
          </div>
          <div className="grid min-h-48 grid-cols-[2.5rem_8rem_minmax(0,1fr)] md:min-h-56 md:grid-cols-[3.5rem_11rem_minmax(0,1fr)]">
            <div className="border-r border-border bg-muted/30" />
            <div className="border-r border-border p-2 md:p-3">
              <div className="h-4 rounded bg-muted md:h-5" />
              <div className="mt-2 grid gap-1.5 md:mt-3 md:gap-2">
                <div className="h-6 rounded bg-muted/70 md:h-7" />
                <div className="h-6 rounded bg-muted/50 md:h-7" />
                <div className="h-6 rounded bg-muted/40 md:h-7" />
              </div>
            </div>
            <div className="grid content-center gap-2 p-3 md:gap-3 md:p-6">
              <div className="h-5 max-w-xs rounded bg-muted md:h-7 md:max-w-sm" />
              <div className="h-16 rounded border border-border bg-background md:h-24" />
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                <div className="h-10 rounded border border-border bg-background md:h-16" />
                <div className="h-10 rounded border border-border bg-background md:h-16" />
                <div className="h-10 rounded border border-border bg-background md:h-16" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
