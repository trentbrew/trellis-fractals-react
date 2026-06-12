'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { detailOpacity, VANTAGE_MORPH_TRANSITION } from '@/lib/fractal/vantage';
import { gridCardPalette } from '@/lib/projections/grid-palette';
import type { FractalPageFixture } from '@/lib/fractal/page-fixtures';
import { cn } from '@/lib/utils';
import { ForceGraphCanvas } from '@/components/fractals/force-graph-canvas';

export function PageGraphCanvas({
  pages,
  focusPageId,
  onFocusPage,
}: {
  pages: FractalPageFixture[];
  focusPageId: string;
  onFocusPage: (pageId: string) => void;
}) {
  return (
    <ForceGraphCanvas
      nodes={pages.map((page) => ({
        id: page.id,
        title: page.title,
        colorIndex: page.colorIndex,
        relatedIds: page.relatedIds,
      }))}
      focusId={focusPageId}
      nodeDataAttribute="data-page-id"
      ariaLabel="Page graph"
      testId="page-graph-canvas"
      emptyMessage="No pages in graph."
      onSelect={onFocusPage}
    />
  );
}

export function PageOutlineList({
  pages,
  focusPageId,
  vantage,
  onFocusPage,
}: {
  pages: FractalPageFixture[];
  focusPageId: string;
  vantage: number;
  onFocusPage: (pageId: string) => void;
}) {
  const slugOpacity = detailOpacity(vantage, 4.5, 0.85);
  const summaryOpacity = detailOpacity(vantage, 5.5, 0.75);

  return (
    <motion.ul
      layout
      className="flex flex-col gap-2"
      data-testid="page-outline-list"
    >
      <AnimatePresence initial={false}>
        {pages.map((page) => {
          const active = page.id === focusPageId;
          const palette = gridCardPalette(page.colorIndex);
          return (
            <motion.li
              key={page.id}
              layout
              layoutId={`page-${page.id}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={VANTAGE_MORPH_TRANSITION}
            >
              <motion.button
                type="button"
                layout="position"
                data-page-id={page.id}
                onClick={() => onFocusPage(page.id)}
                className={cn(
                  'grid w-full grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                  active
                    ? 'border-foreground bg-muted/60'
                    : 'border-border bg-card hover:bg-muted/50',
                )}
              >
                <span
                  className="mt-1 size-3 shrink-0 rounded-full border"
                  style={{
                    background: palette.background,
                    borderColor: palette.foreground,
                  }}
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="block font-medium">{page.title}</span>
                  <span
                    className="block truncate font-mono text-xs text-muted-foreground transition-opacity"
                    style={{ opacity: slugOpacity }}
                  >
                    /{page.slug}
                  </span>
                  <span
                    className="mt-1 block text-xs leading-5 text-muted-foreground transition-opacity"
                    style={{ opacity: summaryOpacity }}
                  >
                    {page.summary}
                  </span>
                </span>
              </motion.button>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </motion.ul>
  );
}

export function PageLayoutSurface({
  page,
  related,
  vantage,
  onFocusPage,
}: {
  page: FractalPageFixture;
  related: FractalPageFixture[];
  vantage: number;
  onFocusPage: (pageId: string) => void;
}) {
  const bodyOpacity = detailOpacity(vantage, 9, 0.55);

  return (
    <motion.div
      layout
      className="grid min-h-112 overflow-hidden rounded-lg border border-border bg-card md:grid-cols-[13rem_minmax(0,1fr)]"
      data-testid="page-layout-surface"
      data-page-id={page.id}
    >
      <aside className="border-b border-border bg-muted/15 p-3 md:border-r md:border-b-0">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Related pages
        </p>
        <nav className="mt-3 grid gap-1">
          <AnimatePresence initial={false}>
            <motion.button
              key={page.id}
              type="button"
              layout
              layoutId={`page-${page.id}`}
              transition={VANTAGE_MORPH_TRANSITION}
              className="rounded-md bg-foreground px-2 py-1.5 text-left text-sm font-medium text-background"
            >
              {page.title}
            </motion.button>
            {related.map((item) => (
              <motion.button
                key={item.id}
                type="button"
                layout
                layoutId={`page-${item.id}`}
                transition={VANTAGE_MORPH_TRANSITION}
                data-page-id={item.id}
                onClick={() => onFocusPage(item.id)}
                className="rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.title}
              </motion.button>
            ))}
          </AnimatePresence>
        </nav>
      </aside>
      <motion.article
        layout
        layoutId={`page-content-${page.id}`}
        transition={VANTAGE_MORPH_TRANSITION}
        className="grid content-start gap-3 p-5 md:p-6"
      >
        <p className="font-mono text-xs text-muted-foreground">/{page.slug}</p>
        <h2 className="text-3xl font-semibold tracking-tight text-balance">{page.title}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{page.summary}</p>
        <p
          className="max-w-2xl text-sm leading-7 text-foreground/90 transition-opacity"
          style={{ opacity: bodyOpacity }}
        >
          {page.body}
        </p>
      </motion.article>
    </motion.div>
  );
}
