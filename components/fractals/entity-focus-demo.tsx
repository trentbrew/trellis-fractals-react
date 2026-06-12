'use client';

import {
  detailOpacity,
  vantageStyle,
} from '@/lib/fractal/vantage';
import { useVantageMotion } from '@/lib/fractal/vantage-motion';
import { resolveVantageCssTransition } from '@/lib/fractal/vantage-motion-types';
import { useVantageState } from '@/lib/fractal/use-vantage-state';
import { useEmbedFlags } from '@/lib/shell/use-embed-flags';
import {
  ENTITY_PRESENTATION_LABELS,
  entityStageMaxWidth,
  resolveEntityPresentation,
  type EntityPresentation,
} from '@/lib/fractal/presentation';
import { FractalEmbedShell } from '@/components/shell/fractal-embed-shell';
import { VantageControlsBar } from '@/components/projections/vantage-controls-bar';
import { VantageDock } from '@/components/projections/vantage-dock';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type FocusEntity = {
  id: string;
  type: string;
  title: string;
  status: string;
  summary: string;
  body: string;
  collection: string;
  color: string;
  fields: { label: string; value: string }[];
  related: string[];
};

const SAMPLE_ENTITY: FocusEntity = {
  id: 'claim:battery-runtime',
  type: 'FractalThing',
  title: 'Battery runtime drops before the advertised threshold',
  status: 'verified',
  summary: 'Return notes and bench drain logs agree on simultaneous laptop and phone load.',
  body:
    'The failure mode is not raw capacity. It appears when the pack is asked to sustain heat, display, and peripheral charging at once. The useful UI question is how much evidence belongs on-screen before the operator commits to the claim.',
  collection: 'commerce truth',
  color: 'oklch(0.64 0.16 172)',
  fields: [
    { label: 'Lane', value: 'main' },
    { label: 'Confidence', value: '0.86' },
    { label: 'Evidence', value: '42 notes' },
    { label: 'Owner', value: 'operator' },
  ],
  related: ['Thermal-cycle qualifier', 'USB-C load transcript', 'Return reason cluster'],
};

function StatusDot({ color = SAMPLE_ENTITY.color, className }: { color?: string; className?: string }) {
  return (
    <span
      className={cn('shrink-0 rounded-full border border-background/50', className)}
      style={{ background: color }}
      aria-hidden
    />
  );
}

function DotPresentation({ entity }: { entity: FocusEntity }) {
  return (
    <div
      className="grid size-16 place-items-center rounded-full border border-border bg-card shadow-sm"
      title={entity.title}
    >
      <StatusDot className="size-4" />
    </div>
  );
}

function ChipPresentation({ entity }: { entity: FocusEntity }) {
  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm shadow-sm">
      <StatusDot className="size-2.5" />
      <span className="min-w-0 truncate font-medium">{entity.title}</span>
    </div>
  );
}

function RowPresentation({ entity, vantage }: { entity: FocusEntity; vantage: number }) {
  return (
    <div className="grid min-h-16 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
      <StatusDot className="size-3" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{entity.title}</p>
        <p
          className="truncate text-xs text-muted-foreground transition-opacity"
          style={{ opacity: detailOpacity(vantage, 4.5, 0.75) }}
        >
          {entity.summary}
        </p>
      </div>
      <Badge variant="outline" className="rounded-md">
        {entity.status}
      </Badge>
    </div>
  );
}

function CardPresentation({ entity, vantage }: { entity: FocusEntity; vantage: number }) {
  return (
    <article className="w-full overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="h-24 border-b border-border" style={{ background: entity.color }} />
      <div className="grid gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-md">
            {entity.type}
          </Badge>
          <Badge variant="outline" className="rounded-md">
            {entity.status}
          </Badge>
        </div>
        <div>
          <h2 className="text-xl font-semibold leading-7 text-balance">{entity.title}</h2>
          <p
            className="mt-2 text-sm leading-6 text-muted-foreground transition-opacity"
            style={{ opacity: detailOpacity(vantage, 6.5, 0.8) }}
          >
            {entity.summary}
          </p>
        </div>
      </div>
    </article>
  );
}

function PanelPresentation({ entity, vantage }: { entity: FocusEntity; vantage: number }) {
  return (
    <section className="grid w-full gap-4 rounded-lg border border-border bg-card p-4 shadow-sm md:grid-cols-[12rem_minmax(0,1fr)]">
      <aside className="grid content-start gap-3 border-b border-border pb-4 md:border-r md:border-b-0 md:pr-4 md:pb-0">
        <div>
          <Badge variant="secondary" className="rounded-md">
            {entity.collection}
          </Badge>
          <p className="mt-2 font-mono text-xs text-muted-foreground">{entity.id}</p>
        </div>
        <div className="grid gap-2 text-xs">
          {entity.fields.map((field) => (
            <div key={field.label} className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{field.label}</span>
              <span className="font-medium">{field.value}</span>
            </div>
          ))}
        </div>
      </aside>
      <div className="grid min-w-0 content-start gap-4">
        <div>
          <div className="flex items-center gap-2">
            <StatusDot className="size-3" />
            <Badge variant="outline" className="rounded-md">
              {entity.status}
            </Badge>
          </div>
          <h2 className="mt-3 text-2xl font-semibold leading-8 text-balance">{entity.title}</h2>
        </div>
        <p
          className="text-sm leading-6 text-muted-foreground transition-opacity"
          style={{ opacity: detailOpacity(vantage, 8, 0.55) }}
        >
          {entity.body}
        </p>
      </div>
    </section>
  );
}

function PagePresentation({ entity }: { entity: FocusEntity }) {
  return (
    <article className="grid min-h-[28rem] w-full overflow-hidden rounded-lg border border-border bg-card shadow-sm lg:grid-cols-[14rem_minmax(0,1fr)]">
      <aside className="border-b border-border bg-muted/25 p-4 lg:border-r lg:border-b-0">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Evidence Graph
        </p>
        <nav className="mt-4 grid gap-1.5">
          {entity.related.map((item) => (
            <span key={item} className="rounded-md px-2 py-1.5 text-sm hover:bg-muted">
              {item}
            </span>
          ))}
        </nav>
      </aside>
      <div className="grid content-start gap-6 p-6">
        <header className="grid gap-3 border-b border-border pb-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-md">
              {entity.type}
            </Badge>
            <Badge variant="outline" className="rounded-md">
              {entity.status}
            </Badge>
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] text-balance">
            {entity.title}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{entity.summary}</p>
        </header>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_14rem]">
          <p className="text-base leading-7 text-foreground/90">{entity.body}</p>
          <dl className="grid content-start gap-3 rounded-lg border border-border bg-background p-3 text-sm">
            {entity.fields.map((field) => (
              <div key={field.label}>
                <dt className="text-xs text-muted-foreground">{field.label}</dt>
                <dd className="font-medium">{field.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </article>
  );
}

function EntityPresentation({
  entity,
  presentation,
  vantage,
}: {
  entity: FocusEntity;
  presentation: EntityPresentation;
  vantage: number;
}) {
  if (presentation === 'dot') return <DotPresentation entity={entity} />;
  if (presentation === 'chip') return <ChipPresentation entity={entity} />;
  if (presentation === 'row') return <RowPresentation entity={entity} vantage={vantage} />;
  if (presentation === 'card') return <CardPresentation entity={entity} vantage={vantage} />;
  if (presentation === 'panel') return <PanelPresentation entity={entity} vantage={vantage} />;
  return <PagePresentation entity={entity} />;
}

export function EntityFocusDemo() {
  const { embed } = useEmbedFlags();
  const [vantage, setVantage] = useVantageState();
  const { motion: vantageMotion } = useVantageMotion();
  const presentation = resolveEntityPresentation(vantage);

  return (
    <FractalEmbedShell
      className="w-full min-w-0 flex-1"
      dock={
        <VantageDock>
          <VantageControlsBar
            vantage={vantage}
            onVantageChange={setVantage}
            projectionLabel={ENTITY_PRESENTATION_LABELS[presentation]}
            className="justify-center"
          />
        </VantageDock>
      }
    >
      <div
        className={cn('flex min-h-0 w-full flex-1 flex-col', embed ? 'h-full gap-2' : 'gap-4')}
        data-testid="entity-focus-demo"
      >
        {!embed ? (
          <header className="flex w-full min-w-0 flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold tracking-tight">Entity</h1>
            </div>
            <Badge variant="secondary" className="rounded-md" data-testid="entity-presentation-label">
              {ENTITY_PRESENTATION_LABELS[presentation]}
            </Badge>
          </header>
        ) : null}

      <main
        className={
          embed
            ? 'flex min-h-0 w-full flex-1 flex-col p-0'
            : 'grid min-h-[32rem] flex-1 place-items-center rounded-lg border border-dashed border-border bg-muted/15 p-4'
        }
      >
        <div
          className={cn(
            'w-full min-w-0',
            embed && presentation === 'dot' && 'flex flex-1 items-center justify-center',
            embed && presentation !== 'dot' && 'flex-1',
          )}
          data-testid="entity-focus-stage"
          data-presentation={presentation}
          style={{
            ...vantageStyle(vantage),
            maxWidth: embed ? '100%' : entityStageMaxWidth(vantage),
            transition: resolveVantageCssTransition(vantageMotion),
          }}
        >
          <EntityPresentation
            entity={SAMPLE_ENTITY}
            presentation={presentation}
            vantage={vantage}
          />
        </div>
      </main>
      </div>
    </FractalEmbedShell>
  );
}
