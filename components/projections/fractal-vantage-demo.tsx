'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2Icon,
  GitBranchIcon,
  Layers3Icon,
  PencilIcon,
  Rows3Icon,
  WifiIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BrowseProjectionShell } from '@/components/shell/browse-projection-shell';
import { ProjectionHeader } from '@/components/shell/ProjectionHeader';
import { VantageControl } from '@/components/projections/vantage-control';
import {
  DEFAULT_VANTAGE,
  detailOpacity,
  resolveShell,
  vantageCssTransition,
  vantageStyle,
  type FractalShell,
} from '@/lib/fractal/vantage';
import { FractalThing, type FractalLane, type FractalThingT } from '@/lib/schemas/fractal-thing';
import { useCollection } from '@/lib/trellis/use-collection';
import { cn } from '@/lib/utils';

type FractalThingAttrs = Omit<FractalThingT, 'id' | 'type'>;
type ThingKernel = Record<FractalLane, Record<string, FractalThingT | undefined>>;

const LANES: FractalLane[] = ['main', 'agent:demo'];
const SPECTRUM = [2, 5, 8, 12];
const FRACTAL_COLLECTION_ID = 'collection:commerce-truth';
const DEFAULT_IDENTITY = 'battery-runtime';

const VANTAGE_LABELS: Record<number, string> = {
  2: 'labeled node',
  5: 'row',
  8: 'claim card',
  12: 'operator card',
};

const DEFAULT_IDENTITIES = [DEFAULT_IDENTITY, 'midsole-rebound', 'retinol-risk'];

const DEFAULT_THINGS: FractalThingAttrs[] = [
  {
    identity: 'battery-runtime',
    title: 'Battery runtime drops before the advertised threshold',
    collectionId: FRACTAL_COLLECTION_ID,
    laneId: 'main',
    status: 'verified',
    body: 'Return notes and bench drain logs agree: simultaneous laptop and phone load is the failure path.',
  },
  {
    identity: 'midsole-rebound',
    title: 'Foam rebound loss appears before outsole wear is visible',
    collectionId: FRACTAL_COLLECTION_ID,
    laneId: 'main',
    status: 'review',
    body: 'Runner logs show discomfort before product photos show visible tread changes.',
  },
  {
    identity: 'retinol-risk',
    title: 'Retinol strength labels hide beginner irritation risk',
    collectionId: FRACTAL_COLLECTION_ID,
    laneId: 'main',
    status: 'draft',
    body: 'Support transcripts mention redness more often than lack of visible effect.',
  },
  {
    identity: 'battery-runtime',
    title: 'Battery runtime claim needs thermal-cycle qualification',
    collectionId: FRACTAL_COLLECTION_ID,
    laneId: 'agent:demo',
    status: 'review',
    body: 'Agent lane keeps the identity anchor while testing a narrower claim before promotion.',
  },
  {
    identity: 'retinol-risk',
    title: 'Retinol onboarding should branch by skin sensitivity',
    collectionId: FRACTAL_COLLECTION_ID,
    laneId: 'agent:demo',
    status: 'draft',
    body: 'The agent draft changes framing without touching the main lane record.',
  },
];

function thingKey(thing: Pick<FractalThingT, 'identity' | 'laneId'>) {
  return `${thing.laneId}:${thing.identity}`;
}

function emptyKernel(): ThingKernel {
  return { main: {}, 'agent:demo': {} };
}

function buildKernel(rows: FractalThingT[]): ThingKernel {
  const next = emptyKernel();
  for (const row of rows) {
    if (!next[row.laneId][row.identity]) {
      next[row.laneId][row.identity] = row;
    }
  }
  return next;
}

function identityList(rows: FractalThingT[]) {
  const ids = new Set([...DEFAULT_IDENTITIES, ...rows.map((row) => row.identity)]);
  return [...ids].sort((a, b) => {
    const aDefault = DEFAULT_IDENTITIES.indexOf(a);
    const bDefault = DEFAULT_IDENTITIES.indexOf(b);
    if (aDefault !== -1 || bDefault !== -1) {
      if (aDefault === -1) return 1;
      if (bDefault === -1) return -1;
      return aDefault - bDefault;
    }
    return a.localeCompare(b);
  });
}

function vantageLabel(vantage: number): string {
  return VANTAGE_LABELS[Math.round(vantage)] ?? `vantage ${vantage.toFixed(1)}`;
}

function statusTone(status: FractalThingT['status']) {
  if (status === 'verified') return 'bg-emerald-500';
  if (status === 'review') return 'bg-sky-500';
  return 'bg-amber-500';
}

function laneLabel(lane: FractalLane) {
  return lane === 'main' ? 'main' : 'agent:demo';
}

function ThingShell({
  record,
  identity,
  lane,
  vantage,
  editable = false,
  saving = false,
  onTitleChange,
}: {
  record: FractalThingT | undefined;
  identity: string;
  lane: FractalLane;
  vantage: number;
  editable?: boolean;
  saving?: boolean;
  onTitleChange?: (title: string) => void;
}) {
  const shell: FractalShell = resolveShell(vantage);
  const style = vantageStyle(vantage);
  const slugOpacity = detailOpacity(vantage, 4, 0.5);
  const bodyOpacity = detailOpacity(vantage, 8, 0.65);
  const label = `${vantage.toFixed(1)} - ${vantageLabel(vantage)}`;

  return (
    <div
      className={cn(
        shell === 'node' &&
          'inline-flex max-w-56 items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs',
        shell === 'row' &&
          'grid min-h-12 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm',
        shell === 'card' &&
          'grid min-w-[min(100%,18rem)] gap-3 rounded-lg border border-border bg-background p-4',
      )}
      data-shell={shell}
      data-thing-id={record?.id ?? identity}
      data-identity={identity}
      data-lane={lane}
      style={{ ...style, transition: vantageCssTransition }}
    >
      <span
        className={cn(
          'size-2 shrink-0 rounded-full',
          record ? statusTone(record.status) : 'bg-muted-foreground/40',
        )}
        aria-hidden
      />

      <div className={cn('min-w-0', shell === 'card' && 'grid gap-2')}>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="font-mono text-[0.68rem] text-muted-foreground">{label}</span>
          {shell !== 'node' ? (
            <Badge variant="outline" className="h-5 rounded-md font-mono">
              {laneLabel(lane)}
            </Badge>
          ) : null}
        </div>

        {record ? (
          <>
            <span
              className={cn(
                'block min-w-0 font-medium',
                shell === 'node' && 'truncate',
                shell === 'row' && 'truncate',
                shell === 'card' && 'text-xl leading-7 text-balance',
              )}
            >
              {record.title}
            </span>
            {shell !== 'node' ? (
              <span
                className="block min-w-0 truncate font-mono text-xs text-muted-foreground transition-opacity"
                style={{ opacity: slugOpacity }}
              >
                {record.collectionId}
              </span>
            ) : null}
            {shell === 'card' ? (
              <p
                className="text-sm leading-6 text-muted-foreground transition-opacity"
                style={{ opacity: bodyOpacity }}
              >
                {record.body}
              </p>
            ) : null}
            {shell === 'card' && editable && onTitleChange ? (
              <label
                className="grid gap-1.5 transition-opacity"
                style={{ opacity: detailOpacity(vantage, 8, 1) }}
              >
                <span className="text-xs font-medium text-muted-foreground">
                  Title {saving ? '(saving)' : ''}
                </span>
                <span className="flex min-w-0 items-center gap-2">
                  <input
                    className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
                    value={record.title}
                    onChange={(event) => onTitleChange(event.target.value)}
                  />
                  <PencilIcon className="size-4 shrink-0 text-muted-foreground" />
                </span>
              </label>
            ) : null}
          </>
        ) : (
          <span className="text-sm text-muted-foreground">
            Not present in {laneLabel(lane)}
          </span>
        )}
      </div>
    </div>
  );
}

export function FractalVantageDemo() {
  const [lane, setLane] = useState<FractalLane>('main');
  const [identity, setIdentity] = useState(DEFAULT_IDENTITY);
  const [vantage, setVantage] = useState(DEFAULT_VANTAGE);
  const [savingId, setSavingId] = useState<string | null>(null);
  const seedStarted = useRef(false);
  const collectionFilter = useMemo(
    () => ({ where: { collectionId: FRACTAL_COLLECTION_ID } }),
    [],
  );
  const { rows, mut, loading, error } = useCollection(FractalThing, collectionFilter);

  useEffect(() => {
    if (loading || error || seedStarted.current) return;
    const existing = new Set(rows.map(thingKey));
    const missing = DEFAULT_THINGS.filter((item) => !existing.has(thingKey(item)));
    if (missing.length === 0) {
      seedStarted.current = true;
      return;
    }

    seedStarted.current = true;
    void Promise.all(missing.map((item) => mut.create(item))).catch((err: unknown) => {
      seedStarted.current = false;
      console.error('[FractalVantageDemo] seed failed', err);
    });
  }, [error, loading, mut, rows]);

  const kernel = useMemo(() => buildKernel(rows), [rows]);
  const identities = useMemo(() => identityList(rows), [rows]);
  const active = kernel[lane][identity];
  const crossTermMain = kernel.main['midsole-rebound'];
  const crossTermAgent = kernel['agent:demo']['retinol-risk'];
  const spectrum = useMemo(
    () =>
      SPECTRUM.map((level) => ({
        level,
        record: active,
      })),
    [active],
  );

  async function updateTitle(record: FractalThingT, title: string) {
    setSavingId(record.id);
    try {
      await mut.update(record.id, { title });
    } catch (err) {
      console.error('[FractalVantageDemo] update failed', err);
    } finally {
      setSavingId((current) => (current === record.id ? null : current));
    }
  }

  return (
    <BrowseProjectionShell className="min-h-0 flex-1 gap-4" data-testid="fractal-app">
      <ProjectionHeader title="Fractal Wedge">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <div className="inline-flex h-8 items-center rounded-lg bg-muted p-0.5">
            {LANES.map((item) => (
              <Button
                key={item}
                type="button"
                variant={item === lane ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7"
                onClick={() => setLane(item)}
              >
                <GitBranchIcon data-icon="inline-start" className="size-3.5" />
                {laneLabel(item)}
              </Button>
            ))}
          </div>
          <Badge variant="outline" className="rounded-md">
            <Layers3Icon className="size-3" />
            identity x lane x vantage
          </Badge>
          <Badge variant="secondary" className="rounded-md">
            <WifiIcon className="size-3" />
            {loading ? 'Loading graph' : 'Live Trellis graph'}
          </Badge>
        </div>
      </ProjectionHeader>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error.message}
        </p>
      ) : null}

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="min-h-0 overflow-auto border-b border-border pb-3 lg:border-r lg:border-b-0 lg:pr-3 lg:pb-0">
          <div className="grid gap-2">
            {identities.map((key) => {
              const item = kernel.main[key] ?? kernel['agent:demo'][key];
              const activeItem = key === identity;
              return (
                <button
                  key={key}
                  type="button"
                  className={cn(
                    'grid min-h-20 gap-2 rounded-lg border px-3 py-2 text-left transition-colors',
                    activeItem
                      ? 'border-foreground bg-muted/60'
                      : 'border-border hover:bg-muted/50',
                  )}
                  onClick={() => setIdentity(key)}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{key}</span>
                    {item ? (
                      <span className={cn('size-2 rounded-full', statusTone(item.status))} />
                    ) : null}
                  </span>
                  <span className="line-clamp-2 text-sm font-medium leading-5">
                    {item?.title ?? key}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="grid min-h-0 content-start gap-4">
          <section className="grid gap-3 rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Rows3Icon className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Spectrum</h2>
              </div>
              <Badge variant="secondary" className="rounded-md">
                {laneLabel(lane)}
              </Badge>
            </div>
            <div className="flex flex-wrap items-start gap-3">
              {spectrum.map((item) => (
                <ThingShell
                  key={item.level}
                  record={item.record}
                  identity={identity}
                  lane={lane}
                  vantage={item.level}
                />
              ))}
            </div>
          </section>

          <section className="grid gap-3 rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Focus</h2>
              </div>
              <VantageControl value={vantage} onChange={setVantage} />
            </div>
            <ThingShell
              record={active}
              identity={identity}
              lane={lane}
              vantage={vantage}
              editable
              saving={active ? savingId === active.id : false}
              onTitleChange={active ? (title) => void updateTitle(active, title) : undefined}
            />
          </section>

          <section className="grid gap-3 rounded-lg border border-dashed border-border p-4">
            <h2 className="text-sm font-semibold">Cross-Term</h2>
            <div className="flex flex-wrap items-start gap-3">
              <ThingShell
                record={crossTermMain}
                identity="midsole-rebound"
                lane="main"
                vantage={2}
              />
              <ThingShell
                record={crossTermAgent}
                identity="retinol-risk"
                lane="agent:demo"
                vantage={12}
                editable
                saving={savingId === crossTermAgent?.id}
                onTitleChange={
                  crossTermAgent
                    ? (title) => void updateTitle(crossTermAgent, title)
                    : undefined
                }
              />
            </div>
          </section>
        </main>
      </div>
    </BrowseProjectionShell>
  );
}
