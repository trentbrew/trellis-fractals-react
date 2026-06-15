'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { StarIcon } from 'lucide-react';
import { useCollection } from '@/lib/trellis/use-collection';
import { Card, type CardT } from '@/lib/schemas/card';
import { applyCollectionBrowse, defaultBrowseState, type BrowseState } from '@/lib/browse/apply';
import { getBrowseConfig } from '@/lib/registry/browse-config';
import { gridCardPalette } from '@/lib/projections/grid-palette';
import { formatPrice } from '@/lib/projections/format';
import {
  CARD_FIELD_DISCLOSURE,
  resolveFieldDisclosure,
} from '@/lib/fractal/disclosure';
import {
  resolveBoardProjection,
  resolveGraphListCrossfade,
  resolveGridColumns,
  resolveListRowMetrics,
  resolveGridGapClass,
  vantageStyle,
  type FractalBoardProjection,
  type GraphListCrossfade,
} from '@/lib/fractal/vantage';
import {
  resolveCrossProjectionLayoutId,
  resolveVantageCssTransition,
  resolveVantageLayout,
  resolveVantageLayoutTransition,
  resolveVantageListPresence,
  resolveVantageMorphTransition,
  type VantageMotion,
} from '@/lib/fractal/vantage-motion-types';
import { useVantageState } from '@/lib/fractal/use-vantage-state';
import { useContainerWidth } from '@/hooks/use-container-width';
import { useEmbedFlags } from '@/lib/shell/use-embed-flags';
import { cn } from '@/lib/utils';
import { BrowseProjectionShell } from '@/components/shell/browse-projection-shell';
import { FractalEmbedShell } from '@/components/shell/fractal-embed-shell';
import { ProjectionHeader } from '@/components/shell/ProjectionHeader';
import { CollectionBrowseBar } from '@/components/shell/CollectionBrowseBar';
import { AddRecordButton } from '@/components/shell/AddRecordButton';
import { useEntityContextMenu } from '@/components/shell/EntityContextMenu';
import { VantageControlsBar } from '@/components/projections/vantage-controls-bar';
import { VantageDock } from '@/components/projections/vantage-dock';
import { GridCard } from './GridCard';
import { CardGraphCanvas } from './CardGraphCanvas';
import { RecordCardDialog } from './RecordCardDialog';

const browseConfig = getBrowseConfig<CardT>(Card);
const COLLECTION_DEMO_MOTION: VantageMotion = 'full';

function resolveGraphListLayers(
  vantage: number,
  reduced: boolean,
): GraphListCrossfade {
  if (reduced) {
    const projection = resolveBoardProjection(vantage);
    return {
      graph: projection === 'graph' ? 1 : 0,
      list: projection === 'list' ? 1 : 0,
    };
  }
  return resolveGraphListCrossfade(vantage);
}

function GraphListProjectionStack({
  rows,
  vantage,
  vantageMotion,
  graphList,
  embed,
  onContextMenu,
}: {
  rows: CardT[];
  vantage: number;
  vantageMotion: VantageMotion;
  graphList: GraphListCrossfade;
  embed: boolean;
  onContextMenu: (event: React.MouseEvent, card: CardT) => void;
}) {
  const blending = graphList.graph > 0 && graphList.list > 0;
  const cssTransition = resolveVantageCssTransition(vantageMotion);

  return (
    <div
      className={cn('relative w-full', blending ? 'min-h-[min(24rem,70vh)]' : 'min-h-0')}
      data-testid="graph-list-crossfade"
      data-graph-list-blending={blending || undefined}
      data-graph-opacity={graphList.graph.toFixed(3)}
      data-list-opacity={graphList.list.toFixed(3)}
    >
      {graphList.graph > 0 ? (
        <div
          className={cn(
            'w-full',
            blending && 'absolute inset-0 flex items-center justify-center',
            embed && !blending && 'flex items-center justify-center',
          )}
          style={{
            opacity: graphList.graph,
            transition: cssTransition,
            pointerEvents: graphList.graph > 0.5 ? 'auto' : 'none',
          }}
          aria-hidden={graphList.graph < 0.05}
        >
          <CardGraphCanvas rows={rows} onContextMenu={onContextMenu} />
        </div>
      ) : null}

      {graphList.list > 0 ? (
        <div
          className={cn('w-full', blending && 'absolute inset-0 overflow-auto')}
          style={{
            opacity: graphList.list,
            transition: cssTransition,
            pointerEvents: graphList.list > 0.5 ? 'auto' : 'none',
          }}
          aria-hidden={graphList.list < 0.05}
        >
          <CardListProjection
            rows={rows}
            vantage={vantage}
            vantageMotion={vantageMotion}
            onContextMenu={onContextMenu}
          />
        </div>
      ) : null}
    </div>
  );
}

function CardListProjection({
  rows,
  vantage,
  vantageMotion,
  onContextMenu,
}: {
  rows: CardT[];
  vantage: number;
  vantageMotion: VantageMotion;
  onContextMenu: (event: React.MouseEvent, card: CardT) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-border p-6 text-sm text-muted-foreground">
        No cards match this view.
      </p>
    );
  }

  const listShell = 'row' as const;
  const rowMetrics = resolveListRowMetrics(vantage);
  const imageDisclosure = resolveFieldDisclosure(
    CARD_FIELD_DISCLOSURE.image,
    vantage,
    listShell,
    'image',
  );
  const categoryDisclosure = resolveFieldDisclosure(
    CARD_FIELD_DISCLOSURE.category,
    vantage,
    listShell,
    'category',
  );
  const priceDisclosure = resolveFieldDisclosure(
    CARD_FIELD_DISCLOSURE.price,
    vantage,
    listShell,
    'price',
  );
  const ratingDisclosure = resolveFieldDisclosure(
    CARD_FIELD_DISCLOSURE.rating,
    vantage,
    listShell,
    'rating',
  );
  const brandDisclosure = resolveFieldDisclosure(
    CARD_FIELD_DISCLOSURE.brand,
    vantage,
    listShell,
    'brand',
  );
  const bodyDisclosure = resolveFieldDisclosure(
    CARD_FIELD_DISCLOSURE.body,
    vantage,
    listShell,
    'body',
  );
  const tagsDisclosure = resolveFieldDisclosure(
    CARD_FIELD_DISCLOSURE.tags,
    vantage,
    listShell,
    'tags',
  );

  const listPresence = resolveVantageListPresence(vantageMotion);
  const listLayout = resolveVantageLayout(vantageMotion);
  const cssTransition = resolveVantageCssTransition(vantageMotion);

  return (
    <motion.ul
      layout={listLayout}
      className="flex flex-col gap-2"
      data-testid="card-list-projection"
      style={vantageStyle(vantage)}
    >
      <AnimatePresence initial={false}>
        {rows.map((card) => {
          const palette = gridCardPalette(card.colorIndex);
          const hasImage = Boolean(card.image);
          const showThumb = imageDisclosure.visible && hasImage;
          const leadSize = showThumb ? rowMetrics.thumbSize : '0.75rem';
          const brandLine = brandDisclosure.visible ? card.brand?.trim() : '';
          const bodyLine = card.body.trim();
          const subtitle = brandLine || (bodyDisclosure.visible ? bodyLine : '');
          const subtitleOpacity = brandLine ? brandDisclosure.opacity : bodyDisclosure.opacity;
          const tags = tagsDisclosure.visible ? (card.tags ?? []).slice(0, 4) : [];

          return (
            <motion.li
              key={card.id}
              layout={listLayout}
              layoutId={resolveCrossProjectionLayoutId(vantageMotion, card.id)}
              initial={listPresence.initial}
              animate={listPresence.animate}
              exit={listPresence.exit}
              transition={resolveVantageMorphTransition(vantageMotion)}
              data-card-id={card.id}
              data-shell="row"
              onContextMenu={(event) => onContextMenu(event, card)}
              style={{
                ...vantageStyle(vantage),
                minHeight: rowMetrics.minHeight,
                paddingBlock: rowMetrics.paddingBlock,
                paddingInline: rowMetrics.paddingInline,
                gap: rowMetrics.gap,
                transition: cssTransition,
              }}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center rounded-lg border border-border bg-card text-sm transition-colors hover:bg-muted/50"
            >
              {showThumb ? (
                // eslint-disable-next-line @next/next/no-img-element -- demo uses arbitrary external URLs; next/image needs remotePatterns config
                <img
                  src={card.image}
                  alt={card.title.trim() || 'Card thumbnail'}
                  loading="lazy"
                  className="rounded-md border border-border object-cover"
                  style={{
                    width: leadSize,
                    height: leadSize,
                  }}
                />
              ) : (
                <span
                  className="rounded-full border"
                  style={{
                    width: leadSize,
                    height: leadSize,
                    background: palette.background,
                    borderColor: palette.foreground,
                  }}
                  aria-hidden
                />
              )}
              <span className="min-w-0">
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="truncate font-medium">
                    {card.title.trim() || 'Untitled card'}
                  </span>
                  {card.category && categoryDisclosure.visible ? (
                    <span
                      style={{ opacity: categoryDisclosure.opacity }}
                      className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      {card.category}
                    </span>
                  ) : null}
                </span>
                {subtitle ? (
                  <span
                    style={{ opacity: subtitleOpacity }}
                    className="block truncate text-xs text-muted-foreground"
                  >
                    {subtitle}
                  </span>
                ) : null}
                {tags.length > 0 ? (
                  <span className="mt-1 flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </span>
                ) : null}
              </span>
              <span className="flex flex-col items-end gap-0.5 text-xs">
                {card.price != null && priceDisclosure.visible ? (
                  <span
                    style={{ opacity: priceDisclosure.opacity }}
                    className="font-semibold text-foreground"
                  >
                    {formatPrice(card.price)}
                  </span>
                ) : null}
                {card.rating != null && ratingDisclosure.visible ? (
                  <span
                    style={{ opacity: ratingDisclosure.opacity }}
                    className="inline-flex items-center gap-1 text-muted-foreground"
                  >
                    <StarIcon className="size-3 fill-amber-500 text-amber-500" />
                    {card.rating.toFixed(1)}
                  </span>
                ) : null}
              </span>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </motion.ul>
  );
}

export function GridBoard() {
  const { embed } = useEmbedFlags();
  const { rows, mut } = useCollection(Card);
  const [browseState, setBrowseState] = useState<BrowseState>(() => defaultBrowseState(browseConfig));
  const [vantage, setVantage] = useVantageState();
  const [focusCardId, setFocusCardId] = useState<string | null>(null);
  const [recordCard, setRecordCard] = useState<CardT | null>(null);
  const boardProjection = resolveBoardProjection(vantage);
  const graphList = resolveGraphListLayers(vantage, false);
  const { ref: boardRef, width: containerWidth } = useContainerWidth();
  const cols = resolveGridColumns(vantage, containerWidth);
  const gridGapClass = resolveGridGapClass(vantage);

  const browsedRows = useMemo(
    () => applyCollectionBrowse(rows, browseState, browseConfig),
    [rows, browseState],
  );

  const { openAt, menu } = useEntityContextMenu((action, entityId) => {
    if (action === 'delete') void mut.remove(entityId);
  });

  async function addCard() {
    const id = await mut.create({ title: '', body: '', colorIndex: rows.length % 16 });
    setFocusCardId(boardProjection === 'grid' ? id : null);
  }

  return (
    <FractalEmbedShell
      dock={
        <VantageDock>
          <VantageControlsBar
            vantage={vantage}
            onVantageChange={setVantage}
            showMotionControl={false}
            fullWidthSlider
            className="justify-center"
          />
        </VantageDock>
      }
    >
      <BrowseProjectionShell className={cn('min-h-0 flex-1', embed ? 'h-full gap-2' : 'gap-4')}>
        {!embed ? (
          <ProjectionHeader title="Grid">
            <div className="flex w-full min-w-0 items-center gap-2">
              <CollectionBrowseBar
                config={browseConfig}
                state={browseState}
                resultCount={browsedRows.length}
                totalCount={rows.length}
                onChange={(patch) => setBrowseState((prev) => ({ ...prev, ...patch }))}
              />
              <AddRecordButton label="New card" onClick={addCard} />
            </div>
          </ProjectionHeader>
        ) : null}

      <div
        ref={boardRef}
        className={cn(
          'min-h-0 flex-1 overflow-auto',
          embed && boardProjection === 'graph' && graphList.list === 0 && 'flex items-center justify-center',
        )}
        data-testid="grid-board-projection"
        data-board-projection={boardProjection}
        data-effective-cols={boardProjection === 'grid' ? cols : undefined}
        data-vantage-motion={COLLECTION_DEMO_MOTION}
        style={vantageStyle(vantage)}
      >
        {boardProjection === 'grid' ? (
          <motion.div
            layout={resolveVantageLayout(COLLECTION_DEMO_MOTION)}
            transition={resolveVantageLayoutTransition(COLLECTION_DEMO_MOTION)}
            style={
              {
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                ...vantageStyle(vantage),
              } as CSSProperties
            }
            className={cn('grid', gridGapClass)}
          >
            <AnimatePresence initial={false}>
              {browsedRows.map((card) => (
                <GridCard
                  key={card.id}
                  card={card}
                  vantage={vantage}
                  vantageMotion={COLLECTION_DEMO_MOTION}
                  recordMorph={recordCard?.id === card.id}
                  autoFocus={card.id === focusCardId}
                  onAutoFocused={() => setFocusCardId(null)}
                  onPersist={(id, patch) => void mut.update(id, patch)}
                  onDelete={(id) => void mut.remove(id)}
                  onOpenRecord={() => setRecordCard(card)}
                  onContextMenu={(event) => openAt(event, card.id)}
                />
              ))}
            </AnimatePresence>
            {browsedRows.length === 0 && (
              <p className="col-span-full text-sm text-muted-foreground">
                {rows.length === 0 ? 'No cards yet — add one above.' : 'No matches — try another search.'}
              </p>
            )}
          </motion.div>
        ) : (
          <GraphListProjectionStack
            rows={browsedRows}
            vantage={vantage}
            vantageMotion={COLLECTION_DEMO_MOTION}
            graphList={graphList}
            embed={embed}
            onContextMenu={(event, card) => openAt(event, card.id)}
          />
        )}
      </div>

      <AnimatePresence>
        {recordCard ? (
          <RecordCardDialog
            card={recordCard}
            vantageMotion={COLLECTION_DEMO_MOTION}
            onClose={() => setRecordCard(null)}
          />
        ) : null}
      </AnimatePresence>

      {menu}
      </BrowseProjectionShell>
    </FractalEmbedShell>
  );
}
