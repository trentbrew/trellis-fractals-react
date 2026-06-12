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
  resolveGridColumns,
  resolveListRowMetrics,
  resolveGridGapClass,
  VANTAGE_LAYOUT_TRANSITION,
  VANTAGE_MORPH_TRANSITION,
  vantageCssTransition,
  vantageStyle,
  type FractalBoardProjection,
} from '@/lib/fractal/vantage';
import { useVantageState } from '@/lib/fractal/use-vantage-state';
import { useContainerWidth } from '@/hooks/use-container-width';
import { useEmbedFlags } from '@/lib/shell/use-embed-flags';
import { cn } from '@/lib/utils';
import { BrowseProjectionShell } from '@/components/shell/browse-projection-shell';
import { ProjectionHeader } from '@/components/shell/ProjectionHeader';
import { CollectionBrowseBar } from '@/components/shell/CollectionBrowseBar';
import { AddRecordButton } from '@/components/shell/AddRecordButton';
import { useEntityContextMenu } from '@/components/shell/EntityContextMenu';
import { VantageControl } from '@/components/projections/vantage-control';
import { VantagePresetControl } from '@/components/projections/vantage-presets';
import { Badge } from '@/components/ui/badge';
import { GridCard } from './GridCard';
import { CardGraphCanvas } from './CardGraphCanvas';
import { RecordCardDialog } from './RecordCardDialog';

const browseConfig = getBrowseConfig<CardT>(Card);
const BOARD_PROJECTION_LABELS: Record<FractalBoardProjection, string> = {
  graph: 'Graph',
  list: 'List',
  grid: 'Grid',
};

function CardListProjection({
  rows,
  vantage,
  onContextMenu,
}: {
  rows: CardT[];
  vantage: number;
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

  return (
    <motion.ul
      layout
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
              layout
              layoutId={`card-${card.id}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={VANTAGE_MORPH_TRANSITION}
              data-card-id={card.id}
              data-shell="row"
              onContextMenu={(event) => onContextMenu(event, card)}
              style={{
                ...vantageStyle(vantage),
                minHeight: rowMetrics.minHeight,
                paddingBlock: rowMetrics.paddingBlock,
                paddingInline: rowMetrics.paddingInline,
                gap: rowMetrics.gap,
                transition: vantageCssTransition,
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
    <BrowseProjectionShell className="min-h-0 flex-1 gap-4">
      <ProjectionHeader title={embed ? 'Collection' : 'Grid'}>
        {!embed ? (
          <CollectionBrowseBar
            config={browseConfig}
            state={browseState}
            resultCount={browsedRows.length}
            totalCount={rows.length}
            onChange={(patch) => setBrowseState((prev) => ({ ...prev, ...patch }))}
          />
        ) : null}
        <Badge variant="secondary" className="shrink-0 rounded-md" data-testid="board-projection-label">
          {BOARD_PROJECTION_LABELS[boardProjection]}
        </Badge>
        <VantagePresetControl value={vantage} onChange={setVantage} />
        <VantageControl
          value={vantage}
          onChange={setVantage}
          className="min-w-40 max-w-64 flex-1"
        />
        {!embed ? <AddRecordButton label="New card" onClick={addCard} /> : null}
      </ProjectionHeader>

      <div
        ref={boardRef}
        className="min-h-0 flex-1"
        data-testid="grid-board-projection"
        data-board-projection={boardProjection}
        data-effective-cols={boardProjection === 'grid' ? cols : undefined}
        style={vantageStyle(vantage)}
      >
        {boardProjection === 'grid' ? (
          <motion.div
            layout
            transition={VANTAGE_LAYOUT_TRANSITION}
            style={{ '--cols': cols, ...vantageStyle(vantage) } as CSSProperties}
            className={cn('grid grid-cols-[repeat(var(--cols),1fr)]', gridGapClass)}
          >
            <AnimatePresence initial={false}>
              {browsedRows.map((card) => (
                <GridCard
                  key={card.id}
                  card={card}
                  vantage={vantage}
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
        ) : null}

        {boardProjection === 'list' ? (
          <CardListProjection
            rows={browsedRows}
            vantage={vantage}
            onContextMenu={(event, card) => openAt(event, card.id)}
          />
        ) : null}

        {boardProjection === 'graph' ? (
          <CardGraphCanvas
            rows={browsedRows}
            onContextMenu={(event, card) => openAt(event, card.id)}
          />
        ) : null}
      </div>

      <AnimatePresence>
        {recordCard ? (
          <RecordCardDialog card={recordCard} onClose={() => setRecordCard(null)} />
        ) : null}
      </AnimatePresence>

      {menu}
    </BrowseProjectionShell>
  );
}
