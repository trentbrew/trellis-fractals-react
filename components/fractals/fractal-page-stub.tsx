'use client';

import { useEmbedFlags } from '@/lib/shell/use-embed-flags';

export function FractalPageStub() {
  const { embed } = useEmbedFlags();

  return (
    <div className={embed ? 'flex min-h-0 flex-1 flex-col' : 'mx-auto flex w-full max-w-3xl flex-col gap-4'}>
      {!embed ? (
        <header className="space-y-2">
          <p className="font-mono text-xs text-muted-foreground">03 / containment</p>
          <h1 className="text-2xl font-semibold tracking-tight">Page</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Thin MVP target: one page as both graph node and full layout surface, with sidebar
            navigation derived from related pages.
          </p>
        </header>
      ) : null}
      <section
        className={
          embed
            ? 'grid min-h-[20rem] flex-1 gap-3 md:grid-cols-[11rem_minmax(0,1fr)]'
            : 'grid gap-4 rounded-lg border border-dashed border-border bg-muted/15 p-5 md:grid-cols-[13rem_minmax(0,1fr)]'
        }
      >
        <aside className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Page graph
          </p>
          <div className="mt-3 grid gap-1.5">
            {['Overview', 'Evidence', 'Decision', 'Follow-up'].map((item, index) => (
              <span
                key={item}
                className={
                  index === 0
                    ? 'rounded-md bg-primary/10 px-2 py-1.5 text-sm font-medium'
                    : 'rounded-md bg-muted px-2 py-1.5 text-sm text-muted-foreground'
                }
              >
                {item}
              </span>
            ))}
          </div>
        </aside>
        <article className="rounded-lg border border-border bg-card p-4 md:p-5">
          <p className="text-xs font-medium text-muted-foreground">Fixture page</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
            Graph-derived layout
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Low vantage: a page node among pages. High vantage: this layout — sidebar from the page
            graph, body from the record. Stub for the next containment demo.
          </p>
        </article>
      </section>
    </div>
  );
}
