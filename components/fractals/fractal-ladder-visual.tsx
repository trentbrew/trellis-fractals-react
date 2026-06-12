'use client';

import { cn } from '@/lib/utils';

const ENTITY_STEPS = ['dot', 'chip', 'row', 'card', 'panel', 'page'] as const;
const COLLECTION_STEPS = ['graph', 'list', 'grid'] as const;

function StepPill({
  label,
  active,
  className,
}: {
  label: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'rounded-md border px-2 py-1 text-[11px] font-medium capitalize',
        active
          ? 'border-primary/40 bg-primary/10 text-foreground'
          : 'border-border bg-card text-muted-foreground',
        className,
      )}
    >
      {label}
    </span>
  );
}

export function FractalLadderVisual({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn('grid gap-6', compact ? 'gap-4 text-sm' : 'gap-6')}
      data-testid="fractal-ladder-visual"
    >
      <div className="grid gap-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Containment levels
        </p>
        <div className="flex flex-wrap gap-2">
          {(['Entity', 'Collection', 'Page', 'App'] as const).map((level, index) => (
            <StepPill
              key={level}
              label={`${index + 1}. ${level}`}
              active={index < 2}
            />
          ))}
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          Entity and Collection are live in the playground. Page and App are sketched.
        </p>
      </div>

      <div className="grid gap-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Entity — one record
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {ENTITY_STEPS.map((step, index) => (
            <div key={step} className="flex items-center gap-1.5">
              <StepPill label={step} active={index === 0 || index === ENTITY_STEPS.length - 1} />
              {index < ENTITY_STEPS.length - 1 ? (
                <span className="text-muted-foreground" aria-hidden>
                  →
                </span>
              ) : null}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Vantage 1 → 12 on a single fixture record.</p>
      </div>

      <div className="grid gap-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Collection — one graph, many projections
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {COLLECTION_STEPS.map((step, index) => (
            <div key={step} className="flex items-center gap-1.5">
              <StepPill label={step} active={index === 0 || index === COLLECTION_STEPS.length - 1} />
              {index < COLLECTION_STEPS.length - 1 ? (
                <span className="text-muted-foreground" aria-hidden>
                  →
                </span>
              ) : null}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Bands: graph ≤2 · list 3–6 · grid 7+ (max 2 cols · compact → tile → card → panel). Same live Card collection throughout.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-3">
        <p className="text-xs leading-5 text-muted-foreground">
          <span className="font-medium text-foreground">Vantage</span> is a continuous parameter (
          <code className="rounded bg-muted px-1">--vantage</code>, slider 1–12). The UI does not
          shrink — it <span className="font-medium text-foreground">changes projection</span>.
        </p>
      </div>
    </div>
  );
}
