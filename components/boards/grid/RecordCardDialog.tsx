'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ExternalLinkIcon, StarIcon, XIcon } from 'lucide-react';
import { gridCardPalette } from '@/lib/projections/grid-palette';
import { formatPrice } from '@/lib/projections/format';
import type { CardT } from '@/lib/schemas/card';
import {
  resolveRecordDialogTransition,
  resolveVantageLayout,
  type VantageMotion,
} from '@/lib/fractal/vantage-motion-types';

/**
 * The record lens, opened by clicking a card. It shares the card's `layoutId`,
 * so framer morphs the card to screen-center and grows it into the dialog. The
 * inner content fades in slightly behind the morph to mask the size-change
 * crossfade. This is the interaction (focus) axis — orthogonal to vantage.
 */
export function RecordCardDialog({
  card,
  vantageMotion,
  onClose,
}: {
  card: CardT;
  vantageMotion: VantageMotion;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const palette = gridCardPalette(card.colorIndex);
  const dialogTransition = resolveRecordDialogTransition(vantageMotion);
  const reduced = vantageMotion === 'reduced';

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={card.title.trim() || 'Record'}
    >
      <motion.div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        initial={{ opacity: reduced ? 1 : 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: reduced ? 1 : 0 }}
        transition={dialogTransition}
        onClick={onClose}
      />

      <motion.div
        layout={resolveVantageLayout(vantageMotion, { recordMorph: true })}
        layoutId={`card-${card.id}`}
        data-testid="record-card-dialog"
        data-card-id={card.id}
        transition={dialogTransition}
        className="relative z-10 flex max-h-[min(88vh,46rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      >
        <div
          className="relative aspect-[16/7] shrink-0 border-b border-border"
          style={{ background: palette.background }}
        >
          {card.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- demo uses arbitrary external URLs; next/image needs remotePatterns config
            <img
              src={card.image}
              alt={card.title.trim() || 'Record image'}
              className="absolute inset-0 size-full object-cover"
            />
          ) : null}
          {card.category ? (
            <span className="absolute left-3 top-3 rounded-md bg-background/85 px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
              {card.category}
            </span>
          ) : null}
          <button
            ref={closeRef}
            type="button"
            aria-label="Close record"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-md bg-background/85 p-1.5 text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <motion.div
          initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 8 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: reduced ? { duration: 0 } : { delay: 0.12, duration: 0.25 },
          }}
          className="flex min-h-0 flex-col gap-4 overflow-auto p-6"
        >
          <div className="flex flex-col gap-1">
            {card.brand ? (
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {card.brand}
              </span>
            ) : null}
            <h2 className="text-2xl font-semibold tracking-tight text-balance">
              {card.title.trim() || 'Untitled'}
            </h2>
            <div className="mt-1 flex items-center gap-3 text-sm">
              {card.price != null ? (
                <span className="text-lg font-semibold text-foreground">{formatPrice(card.price)}</span>
              ) : null}
              {card.rating != null ? (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <StarIcon className="size-4 fill-amber-500 text-amber-500" />
                  {card.rating.toFixed(1)}
                </span>
              ) : null}
            </div>
          </div>

          {card.body.trim() ? (
            <p className="text-sm leading-7 text-foreground/90">{card.body}</p>
          ) : null}

          {card.tags?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {card.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {card.url ? (
            <a
              href={card.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              View
              <ExternalLinkIcon className="size-3.5" />
            </a>
          ) : null}
        </motion.div>
      </motion.div>
    </div>
  );
}
