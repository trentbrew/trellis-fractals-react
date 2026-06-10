'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { XIcon } from 'lucide-react';
import { useFocusSafeField } from '@/lib/hooks/use-focus-safe-field';
import { gridCardPalette } from '@/lib/projections/grid-palette';
import type { CardT } from '@/lib/schemas/card';

export function GridCard({
  card,
  autoFocus,
  onAutoFocused,
  onPersist,
  onDelete,
  onContextMenu,
}: {
  card: CardT;
  autoFocus?: boolean;
  onAutoFocused?: () => void;
  onPersist: (id: string, patch: { title?: string; body?: string }) => void;
  onDelete: (id: string) => void;
  onContextMenu: (event: React.MouseEvent) => void;
}) {
  const titleRef = useRef<HTMLInputElement>(null);
  const palette = gridCardPalette(card.colorIndex);

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

  return (
    <motion.div
      layout
      layoutId={`card-${card.id}`}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, y: 8 }}
      transition={{ type: 'spring', bounce: 0.3, duration: 0.45 }}
      onContextMenu={onContextMenu}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-colors hover:bg-muted/50"
    >
      <div
        className="aspect-video border-b border-border"
        style={{ background: palette.background }}
      />
      <div className="flex flex-col gap-1.5 p-3">
        <input
          ref={titleRef}
          placeholder="Title"
          value={title.value}
          onChange={title.onChange}
          onFocus={title.onFocus}
          onBlur={title.onBlur}
          onKeyDown={title.onKeyDown}
          className="w-full bg-transparent text-sm font-medium outline-none placeholder:opacity-50"
        />
        <textarea
          placeholder="Notes…"
          value={body.value}
          onChange={body.onChange}
          onFocus={body.onFocus}
          onBlur={body.onBlur}
          rows={2}
          className="w-full resize-none bg-transparent text-xs text-muted-foreground outline-none placeholder:opacity-50"
        />
      </div>
      <button
        type="button"
        aria-label="Delete card"
        onClick={() => onDelete(card.id)}
        className="absolute top-2 right-2 rounded-md bg-background/80 p-1 text-muted-foreground opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:text-destructive"
      >
        <XIcon className="size-3.5" />
      </button>
    </motion.div>
  );
}
