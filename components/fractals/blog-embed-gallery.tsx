'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MonitorIcon, SmartphoneIcon, TabletIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { cn } from '@/lib/utils';

const SITE = 'https://playground.trellis.computer';

export type BlogEmbedSpec = {
  id: string;
  title: string;
  caption: string;
  path: string;
  height: number;
  /** Hide device preview toggle for static reference embeds. */
  hideDevicePreview?: boolean;
};

export type DeviceFrame = 'desktop' | 'tablet' | 'mobile';

export const DEVICE_FRAME_WIDTH: Record<DeviceFrame, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '390px',
};

const DEVICE_OPTIONS: {
  id: DeviceFrame;
  label: string;
  icon: typeof MonitorIcon;
}[] = [
  { id: 'desktop', label: 'Desktop', icon: MonitorIcon },
  { id: 'tablet', label: 'Tablet', icon: TabletIcon },
  { id: 'mobile', label: 'Mobile', icon: SmartphoneIcon },
];

export const BLOG_EMBEDS: BlogEmbedSpec[] = [
  {
    id: 'ladder',
    title: 'Ladder overview',
    caption: 'Containment levels + projection bands (static reference).',
    path: '/fractals/ladder?embed=1',
    height: 420,
    hideDevicePreview: true,
  },
  {
    id: 'entity-dot',
    title: 'Entity — dot',
    caption: 'Vantage 1 — identity only.',
    path: '/fractals/entity?embed=1&vantage=1',
    height: 520,
  },
  {
    id: 'entity-page',
    title: 'Entity — page',
    caption: 'Vantage 12 — full page presentation.',
    path: '/fractals/entity?embed=1&vantage=12',
    height: 640,
  },
  {
    id: 'collection-graph',
    title: 'Collection — graph',
    caption: 'Vantage 1 — force-directed graph.',
    path: '/fractals/collection?embed=1&vantage=1',
    height: 560,
  },
  {
    id: 'collection-grid',
    title: 'Collection — grid',
    caption: 'Vantage 10 — two-column grid (compact → tile → card variants).',
    path: '/fractals/collection?embed=1&vantage=10',
    height: 640,
  },
  {
    id: 'kanban',
    title: 'Kanban — live graph',
    caption: 'Writable room; open two same-browser tabs for cursors + sync.',
    path: '/projections/kanban?embed=1&room=fractals-blog',
    height: 560,
  },
];

function iframeSnippet(path: string, height: number, origin = SITE) {
  const src = `${origin}${path}`;
  return `<iframe
  src="${src}"
  title="Trellis Fractals Playground"
  width="100%"
  height="${height}"
  style="border:1px solid var(--border, #333); border-radius:8px;"
  loading="lazy"
  allow="clipboard-write"
></iframe>`;
}

function DeviceFrameToggle({
  value,
  onChange,
  className,
}: {
  value: DeviceFrame;
  onChange: (frame: DeviceFrame) => void;
  className?: string;
}) {
  return (
    <ButtonGroup
      data-testid="embed-device-toggle"
      role="radiogroup"
      aria-label="Device preview width"
      className={className}
    >
      {DEVICE_OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = value === option.id;
        return (
          <Button
            key={option.id}
            type="button"
            variant="outline"
            size="sm"
            role="radio"
            aria-checked={active}
            aria-label={`${option.label} preview`}
            className={cn('px-2', active && 'bg-muted text-foreground')}
            onClick={() => onChange(option.id)}
          >
            <Icon data-icon="inline-start" className="size-3.5" />
            <span className="hidden sm:inline">{option.label}</span>
          </Button>
        );
      })}
    </ButtonGroup>
  );
}

export function BlogEmbedGallery() {
  const [deviceFrame, setDeviceFrame] = useState<DeviceFrame>('desktop');
  const frameWidth = DEVICE_FRAME_WIDTH[deviceFrame];
  const isNarrowPreview = deviceFrame !== 'desktop';

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
      <header className="space-y-3">
        <p className="font-mono text-xs text-muted-foreground">brew.build · QA</p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Blog embed gallery</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Preview every iframe before publish. Copy paths from{' '}
              <code className="rounded bg-muted px-1 text-xs">docs/fractals-blog-embeds.md</code>.
            </p>
          </div>
          <DeviceFrameToggle value={deviceFrame} onChange={setDeviceFrame} />
        </div>
        <p className="text-xs text-muted-foreground">
          Device preview constrains iframe width only — vantage and query params inside each embed
          stay unchanged.
        </p>
      </header>

      {BLOG_EMBEDS.map((spec) => (
        <section key={spec.id} className="grid gap-3" id={spec.id}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">{spec.title}</h2>
              <p className="text-sm text-muted-foreground">{spec.caption}</p>
            </div>
            <Link
              href={spec.path}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              Open tab →
            </Link>
          </div>
          <div
            className={cn(
              'relative mx-auto w-full transition-[max-width] duration-300 ease-out',
              isNarrowPreview && !spec.hideDevicePreview && 'rounded-[1.25rem] bg-muted/20 p-2',
            )}
            style={{
              maxWidth: spec.hideDevicePreview ? '100%' : frameWidth,
            }}
            data-testid="embed-device-frame"
            data-device-frame={spec.hideDevicePreview ? 'desktop' : deviceFrame}
          >
            <iframe
              src={spec.path}
              title={spec.title}
              className={cn(
                'w-full rounded-lg border border-border bg-background',
                isNarrowPreview && !spec.hideDevicePreview && 'shadow-sm',
              )}
              style={{ height: spec.height }}
              loading="lazy"
            />
          </div>
          <details className="rounded-lg border border-border bg-muted/15 px-3 py-2">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
              iframe HTML
            </summary>
            <pre className="mt-2 overflow-x-auto text-[11px] leading-relaxed text-muted-foreground">
              {iframeSnippet(spec.path, spec.height)}
            </pre>
          </details>
        </section>
      ))}
    </div>
  );
}
