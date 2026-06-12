'use client';

import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useCollection } from '@/lib/trellis/use-collection';
import { Card, type CardT } from '@/lib/schemas/card';
import { gridCardPalette } from '@/lib/projections/grid-palette';
import { BrowseProjectionShell } from '@/components/shell/browse-projection-shell';
import { ProjectionHeader } from '@/components/shell/ProjectionHeader';
import { CollectionViewHint } from '@/components/shell/CollectionViewHint';
import { AddRecordButton } from '@/components/shell/AddRecordButton';
import { cn } from '@/lib/utils';

function GalleryPreview({ card, large }: { card: CardT; large?: boolean }) {
  const palette = gridCardPalette(card.colorIndex);
  return (
    <div
      className={cn(
        'flex shrink-0 snap-center flex-col justify-end overflow-hidden rounded-2xl border p-5 transition-shadow',
        large ? 'h-72 w-[min(72vw,520px)]' : 'h-16 w-24',
      )}
      style={{
        background: palette.background,
        borderColor: palette.border,
        color: palette.foreground,
      }}
    >
      <p className={cn('font-semibold', large ? 'text-2xl' : 'truncate text-xs')}>
        {card.title || 'Untitled'}
      </p>
      {large && card.body ? (
        <p className="mt-2 line-clamp-3 text-sm opacity-80">{card.body}</p>
      ) : null}
    </div>
  );
}

export function GalleryBoard() {
  const { rows, mut } = useCollection(Card);
  const [activeId, setActiveId] = useState<string | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const active = useMemo(() => {
    if (!rows.length) return null;
    return rows.find((row) => row.id === activeId) ?? rows[0];
  }, [rows, activeId]);

  function scrollToCard(id: string) {
    setActiveId(id);
    const el = stripRef.current?.querySelector(`[data-gallery-id="${id}"]`);
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  async function addCard() {
    const id = await mut.create({ title: '', body: '', colorIndex: rows.length % 16 });
    setActiveId(id);
  }

  return (
    <BrowseProjectionShell className="gap-4">
      <ProjectionHeader title="Gallery">
        <CollectionViewHint schema={Card} />
        <AddRecordButton label="New card" onClick={addCard} />
      </ProjectionHeader>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No cards yet — seed fixtures with{' '}
          <code className="rounded bg-muted px-1 py-0.5">just seed-projections</code>.
        </p>
      ) : (
        <>
          <div
            ref={stripRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
            onScroll={() => {
              /* selection driven by thumb strip clicks */
            }}
          >
            {rows.map((card) => (
              <button
                key={card.id}
                type="button"
                data-gallery-id={card.id}
                className="shrink-0 snap-center"
                onClick={() => scrollToCard(card.id)}
              >
                <motion.div
                  layout
                  animate={{ scale: active?.id === card.id ? 1 : 0.96, opacity: active?.id === card.id ? 1 : 0.72 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                >
                  <GalleryPreview card={card} large />
                </motion.div>
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {rows.map((card) => {
              const palette = gridCardPalette(card.colorIndex);
              const isActive = active?.id === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  aria-label={card.title || 'Untitled'}
                  className={cn(
                    'shrink-0 rounded-lg border-2 transition-all',
                    isActive ? 'scale-105' : 'opacity-60 hover:opacity-90',
                  )}
                  style={{ borderColor: isActive ? palette.foreground : palette.border }}
                  onClick={() => scrollToCard(card.id)}
                >
                  <GalleryPreview card={card} />
                </button>
              );
            })}
          </div>
        </>
      )}
    </BrowseProjectionShell>
  );
}
