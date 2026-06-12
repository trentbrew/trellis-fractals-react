'use client';

import { useCallback, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import {
  DEFAULT_PAGE_ID,
  relatedPages,
  SAMPLE_PAGES,
} from '@/lib/fractal/page-fixtures';
import {
  PAGE_PROJECTION_LABELS,
  resolvePageProjection,
} from '@/lib/fractal/page-projection';
import { useVantageMotion } from '@/lib/fractal/vantage-motion';
import {
  resolveVantageLayout,
  resolveVantageProjectionTransition,
} from '@/lib/fractal/vantage-motion-types';
import { useVantageState } from '@/lib/fractal/use-vantage-state';
import { vantageStyle } from '@/lib/fractal/vantage';
import { useEmbedFlags } from '@/lib/shell/use-embed-flags';
import { FractalEmbedShell } from '@/components/shell/fractal-embed-shell';
import { VantageControlsBar } from '@/components/projections/vantage-controls-bar';
import { VantageDock } from '@/components/projections/vantage-dock';
import { PAGE_VANTAGE_PRESETS } from '@/components/projections/vantage-presets';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  PageGraphCanvas,
  PageLayoutSurface,
  PageOutlineList,
} from '@/components/fractals/page-graph-canvas';

export function PageFocusDemo() {
  const { embed } = useEmbedFlags();
  const [vantage, setVantage] = useVantageState(10);
  const { motion: vantageMotion } = useVantageMotion();
  const [focusPageId, setFocusPageId] = useState(DEFAULT_PAGE_ID);
  const projectionTransition = resolveVantageProjectionTransition(vantageMotion);
  const projectionLayout = resolveVantageLayout(vantageMotion);
  const reduced = vantageMotion === 'reduced';
  const projection = resolvePageProjection(vantage);
  const focusPage = SAMPLE_PAGES.find((page) => page.id === focusPageId) ?? SAMPLE_PAGES[0];
  const related = relatedPages(focusPage);

  const handleFocusPage = useCallback((pageId: string) => {
    setFocusPageId(pageId);
  }, []);

  return (
    <FractalEmbedShell
      dock={
        <VantageDock>
          <VantageControlsBar
            vantage={vantage}
            onVantageChange={setVantage}
            projectionLabel={PAGE_PROJECTION_LABELS[projection]}
            presets={PAGE_VANTAGE_PRESETS}
            className="justify-center"
          />
        </VantageDock>
      }
    >
      <div
        className={cn('flex min-h-0 flex-1 flex-col', embed ? 'h-full gap-2' : 'gap-4')}
        data-testid="page-focus-demo"
      >
        {!embed ? (
          <header className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold tracking-tight">Page</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                One route as graph node, outline, and layout with a graph-derived sidebar.
              </p>
            </div>
            <Badge variant="secondary" className="rounded-md" data-testid="page-projection-label">
              {PAGE_PROJECTION_LABELS[projection]}
            </Badge>
          </header>
        ) : null}

      <LayoutGroup id="page-focus">
        <div
          className="relative min-h-0 flex-1"
          data-testid="page-focus-projection"
          data-page-projection={projection}
          style={vantageStyle(vantage)}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {projection === 'graph' ? (
              <motion.div
                key="graph"
                layout={projectionLayout}
                initial={{ opacity: reduced ? 1 : 0, scale: reduced ? 1 : 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: reduced ? 1 : 0, scale: reduced ? 1 : 0.98 }}
                transition={projectionTransition}
              >
                <PageGraphCanvas
                  pages={SAMPLE_PAGES}
                  focusPageId={focusPage.id}
                  onFocusPage={handleFocusPage}
                />
              </motion.div>
            ) : null}

            {projection === 'outline' ? (
              <motion.div
                key="outline"
                layout={projectionLayout}
                initial={{ opacity: reduced ? 1 : 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: reduced ? 1 : 0 }}
                transition={projectionTransition}
              >
                <PageOutlineList
                  pages={SAMPLE_PAGES}
                  focusPageId={focusPage.id}
                  vantage={vantage}
                  onFocusPage={handleFocusPage}
                />
              </motion.div>
            ) : null}

            {projection === 'layout' ? (
              <motion.div
                key="layout"
                layout={projectionLayout}
                initial={{ opacity: reduced ? 1 : 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: reduced ? 1 : 0 }}
                transition={projectionTransition}
              >
                <PageLayoutSurface
                  page={focusPage}
                  related={related}
                  vantage={vantage}
                  onFocusPage={handleFocusPage}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </LayoutGroup>
      </div>
    </FractalEmbedShell>
  );
}
