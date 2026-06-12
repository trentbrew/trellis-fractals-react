'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { StarIcon, XIcon } from 'lucide-react';
import { useFocusSafeField } from '@/lib/hooks/use-focus-safe-field';
import { gridCardPalette } from '@/lib/projections/grid-palette';
import { formatPrice } from '@/lib/projections/format';
import type { CardT } from '@/lib/schemas/card';
import {
  CARD_FIELD_DISCLOSURE,
  resolveFieldDisclosure,
} from '@/lib/fractal/disclosure';
import {
  resolveVantageCardPresence,
  resolveVantageLayout,
  resolveVantageMorphTransition,
  type VantageMotion,
} from '@/lib/fractal/vantage-motion-types';
import {
  resolveGridCardVariant,
  vantageStyle,
  type GridCardVariant,
} from '@/lib/fractal/vantage';
import { cn } from '@/lib/utils';

function variantShellClass(variant: GridCardVariant) {
  if (variant === 'tile') return 'rounded-lg';
  if (variant === 'panel') return 'rounded-xl shadow-md';
  return variant === 'compact' ? 'rounded-lg' : 'rounded-xl';
}

export function GridCard({
  card,
  vantage,
  autoFocus,
  onAutoFocused,
  onPersist,
  onDelete,
  onOpenRecord,
  onContextMenu,
  recordMorph = false,
  vantageMotion,
}: {
  card: CardT;
  vantage: number;
  vantageMotion: VantageMotion;
  autoFocus?: boolean;
  onAutoFocused?: () => void;
  onPersist: (id: string, patch: { title?: string; body?: string }) => void;
  onDelete: (id: string) => void;
  onOpenRecord?: () => void;
  onContextMenu: (event: React.MouseEvent) => void;
  /** Full size morph for shared-layout record lens — off during vantage drag. */
  recordMorph?: boolean;
}) {
  const titleRef = useRef<HTMLInputElement>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const palette = gridCardPalette(card.colorIndex);
  const variant = resolveGridCardVariant(vantage);
  const shell = 'card' as const;
  const presence = resolveVantageCardPresence(vantageMotion);
  const layout = resolveVantageLayout(vantageMotion, { recordMorph });

  const categoryDisclosure = resolveFieldDisclosure(
    CARD_FIELD_DISCLOSURE.category,
    vantage,
    shell,
    'category',
  );
  const priceDisclosure = resolveFieldDisclosure(
    CARD_FIELD_DISCLOSURE.price,
    vantage,
    shell,
    'price',
  );
  const ratingDisclosure = resolveFieldDisclosure(
    CARD_FIELD_DISCLOSURE.rating,
    vantage,
    shell,
    'rating',
  );
  const bodyDisclosure = resolveFieldDisclosure(
    CARD_FIELD_DISCLOSURE.body,
    vantage,
    shell,
    'body',
  );
  const brandDisclosure = resolveFieldDisclosure(
    CARD_FIELD_DISCLOSURE.brand,
    vantage,
    shell,
    'brand',
  );
  const tagsDisclosure = resolveFieldDisclosure(
    CARD_FIELD_DISCLOSURE.tags,
    vantage,
    shell,
    'tags',
  );

  const hasImage = Boolean(card.image) && !imageFailed;
  const title = useFocusSafeField(card.title, (value) => onPersist(card.id, { title: value }));
  const body = useFocusSafeField(card.body, (value) => onPersist(card.id, { body: value }));

  useEffect(() => {
    if (!autoFocus) return;
    const input = titleRef.current;
    if (!input) return;
    requestAnimationFrame(() => {
      input.focus();
      input.select();
      onAutoFocused?.();
    });
  }, [autoFocus, onAutoFocused]);

  const thumbInteractive = Boolean(onOpenRecord);
  const thumbProps = {
    style: { background: palette.background } as const,
    'data-interactive': thumbInteractive ? ('true' as const) : undefined,
    role: thumbInteractive ? ('button' as const) : undefined,
    tabIndex: thumbInteractive ? 0 : undefined,
    'aria-label': thumbInteractive ? `Open ${card.title.trim() || 'record'}` : undefined,
    onClick: onOpenRecord,
    onKeyDown: (event: React.KeyboardEvent) => {
      if (thumbInteractive && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onOpenRecord?.();
      }
    },
  };

  const deleteButton = (
    <button
      type="button"
      aria-label="Delete card"
      onClick={() => onDelete(card.id)}
      className={cn(
        'absolute top-2 right-2 rounded-md p-1 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:text-destructive',
        variant === 'tile'
          ? 'bg-black/40 text-white/90 hover:bg-black/55'
          : 'bg-background/80 text-muted-foreground',
      )}
    >
      <XIcon className="size-3.5" />
    </button>
  );

  const categoryPill =
    card.category && categoryDisclosure.visible ? (
      <span
        style={{ opacity: categoryDisclosure.opacity }}
        className={cn(
          'absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide backdrop-blur-sm',
          variant === 'tile'
            ? 'bg-black/45 text-white/95'
            : 'bg-background/85 text-muted-foreground',
        )}
      >
        {card.category}
      </span>
    ) : null;

  const priceLine =
    card.price != null && priceDisclosure.visible ? (
      <span
        style={{ opacity: priceDisclosure.opacity }}
        className={cn(
          'font-semibold',
          variant === 'tile' ? 'shrink-0 text-[11px] text-white/95' : 'text-foreground',
        )}
      >
        {formatPrice(card.price)}
      </span>
    ) : null;

  const ratingLine =
    card.rating != null && ratingDisclosure.visible ? (
      <span
        style={{ opacity: ratingDisclosure.opacity }}
        className="inline-flex items-center gap-1 text-muted-foreground"
      >
        <StarIcon className="size-3 fill-amber-500 text-amber-500" />
        {card.rating.toFixed(1)}
      </span>
    ) : null;

  return (
    <motion.div
      layout={layout}
      layoutId={`card-${card.id}`}
      initial={presence.initial}
      animate={presence.animate}
      exit={presence.exit}
      transition={resolveVantageMorphTransition(vantageMotion)}
      onContextMenu={onContextMenu}
      data-shell="card"
      data-card-variant={variant}
      data-card-id={card.id}
      style={vantageStyle(vantage)}
      className={cn(
        'group relative overflow-hidden border border-border bg-card transition-colors hover:bg-muted/50',
        variant === 'compact' &&
          'grid min-h-[4.5rem] grid-cols-[auto_minmax(0,1fr)] items-center gap-2 p-2',
        variant !== 'compact' && 'flex flex-col',
        variantShellClass(variant),
      )}
    >
      {variant === 'compact' ? (
        <>
          <div
            className={cn(
              'group/thumb relative size-14 shrink-0 overflow-hidden rounded-md border border-border',
              thumbInteractive && 'cursor-pointer',
            )}
            {...thumbProps}
          >
            {thumbInteractive ? (
              <span className="absolute inset-0 z-10 bg-foreground/0 transition-colors group-hover/thumb:bg-foreground/5" />
            ) : null}
            {hasImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- demo uses arbitrary external URLs
              <img
                src={card.image}
                alt={card.title.trim() || 'Card thumbnail'}
                loading="lazy"
                onError={() => setImageFailed(true)}
                className="absolute inset-0 size-full object-cover"
              />
            ) : null}
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            {card.category && categoryDisclosure.visible ? (
              <span
                style={{ opacity: categoryDisclosure.opacity }}
                className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
              >
                {card.category}
              </span>
            ) : null}
            <input
              ref={titleRef}
              placeholder="Title"
              value={title.value}
              onChange={title.onChange}
              onFocus={title.onFocus}
              onBlur={title.onBlur}
              onKeyDown={title.onKeyDown}
              className="w-full truncate bg-transparent text-xs font-medium outline-none placeholder:opacity-50"
            />
            {priceLine || ratingLine ? (
              <div className="flex items-center justify-between gap-2 text-[11px]">
                {priceLine}
                {ratingLine}
              </div>
            ) : null}
          </div>
          {deleteButton}
        </>
      ) : variant === 'tile' ? (
        <div
          className={cn(
            'group/thumb relative aspect-square data-[interactive=true]:cursor-pointer',
            thumbInteractive && 'cursor-pointer',
          )}
          {...thumbProps}
        >
          {thumbInteractive ? (
            <span className="absolute inset-0 z-10 bg-foreground/0 transition-colors group-hover/thumb:bg-foreground/5" />
          ) : null}
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- demo uses arbitrary external URLs
            <img
              src={card.image}
              alt={card.title.trim() || 'Card thumbnail'}
              loading="lazy"
              onError={() => setImageFailed(true)}
              className="absolute inset-0 size-full object-cover"
            />
          ) : null}
          {categoryPill}
          <div className="absolute inset-x-0 bottom-0 z-20 bg-linear-to-t from-black/75 via-black/45 to-transparent px-2 pb-2 pt-8">
            <div className="flex items-end justify-between gap-2">
              <input
                ref={titleRef}
                placeholder="Title"
                value={title.value}
                onChange={title.onChange}
                onFocus={title.onFocus}
                onBlur={title.onBlur}
                onKeyDown={title.onKeyDown}
                className="min-w-0 flex-1 truncate bg-transparent text-xs font-medium text-white outline-none placeholder:text-white/50"
              />
              {priceLine}
            </div>
          </div>
          {deleteButton}
        </div>
      ) : (
        <>
          <div
            className={cn(
              'group/thumb relative border-b border-border data-[interactive=true]:cursor-pointer',
              variant === 'card' && 'aspect-video',
              variant === 'panel' && 'aspect-4/3',
            )}
            {...thumbProps}
          >
            {thumbInteractive ? (
              <span className="absolute inset-0 z-10 bg-foreground/0 transition-colors group-hover/thumb:bg-foreground/5" />
            ) : null}
            {hasImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- demo uses arbitrary external URLs
              <img
                src={card.image}
                alt={card.title.trim() || 'Card thumbnail'}
                loading="lazy"
                onError={() => setImageFailed(true)}
                className="absolute inset-0 size-full object-cover"
              />
            ) : null}
            {categoryPill}
          </div>

          <div
            className={cn(
              'flex flex-col',
              variant === 'card' && 'gap-1.5 p-3',
              variant === 'panel' && 'gap-2 p-4',
            )}
          >
            {(variant === 'panel' || variant === 'card') &&
            card.brand &&
            brandDisclosure.visible ? (
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {card.brand}
              </span>
            ) : null}

            <input
              ref={titleRef}
              placeholder="Title"
              value={title.value}
              onChange={title.onChange}
              onFocus={title.onFocus}
              onBlur={title.onBlur}
              onKeyDown={title.onKeyDown}
              className={cn(
                'w-full bg-transparent font-medium outline-none placeholder:opacity-50',
                variant === 'card' && 'text-sm',
                variant === 'panel' && 'text-lg leading-7',
              )}
            />

            {priceLine || ratingLine ? (
              <div className="flex items-center justify-between gap-2 text-xs">
                {priceLine}
                {ratingLine}
              </div>
            ) : null}

            <textarea
                placeholder="Notes…"
                value={body.value}
                onChange={body.onChange}
                onFocus={body.onFocus}
                onBlur={body.onBlur}
                rows={variant === 'panel' ? 3 : 2}
                className="w-full resize-none bg-transparent text-xs text-muted-foreground outline-none placeholder:opacity-50 transition-opacity"
              style={{ opacity: bodyDisclosure.opacity }}
            />

            {tagsDisclosure.visible && (card.tags?.length ?? 0) > 0 ? (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {card.tags!.slice(0, variant === 'panel' ? 6 : 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {deleteButton}
        </>
      )}
    </motion.div>
  );
}
