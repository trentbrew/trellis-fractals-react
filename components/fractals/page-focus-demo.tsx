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
import { useVantageState } from '@/lib/fractal/use-vantage-state';
import { VANTAGE_PROJECTION_TRANSITION, vantageStyle } from '@/lib/fractal/vantage';
import { useEmbedFlags } from '@/lib/shell/use-embed-flags';
import { VantageControl } from '@/components/projections/vantage-control';
import {
  PAGE_VANTAGE_PRESETS,
  VantagePresetControl,
} from '@/components/projections/vantage-presets';
import { Badge } from '@/components/ui/badge';
import {
  PageGraphCanvas,
  PageLayoutSurface,
  PageOutlineList,
} from '@/components/fractals/page-graph-canvas';

export function PageFocusDemo() {
  const { embed } = useEmbedFlags();
  const [vantage, setVantage] = useVantageState(10);
  const [focusPageId, setFocusPageId] = useState(DEFAULT_PAGE_ID);
  const projection = resolvePageProjection(vantage);
  const focusPage = SAMPLE_PAGES.find((page) => page.id === focusPageId) ?? SAMPLE_PAGES[0];
  const related = relatedPages(focusPage);

  const handleFocusPage = useCallback((pageId: string) => {
    setFocusPageId(pageId);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4" data-testid="page-focus-demo">
      <header className="flex flex-wrap items-center gap-3">
        {!embed ? (
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight">Page</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              One route as graph node, outline, and layout with a graph-derived sidebar.
            </p>
          </div>
        ) : null}
        <Badge variant="secondary" className="rounded-md" data-testid="page-projection-label">
          {PAGE_PROJECTION_LABELS[projection]}
        </Badge>
        <VantagePresetControl
          value={vantage}
          onChange={setVantage}
          presets={PAGE_VANTAGE_PRESETS}
        />
        <VantageControl
          value={vantage}
          onChange={setVantage}
          className="min-w-48 max-w-72 flex-1"
        />
      </header>

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
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={VANTAGE_PROJECTION_TRANSITION}
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
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={VANTAGE_PROJECTION_TRANSITION}
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
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={VANTAGE_PROJECTION_TRANSITION}
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
  );
}
