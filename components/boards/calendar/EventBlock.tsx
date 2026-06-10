'use client';

import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { XIcon } from 'lucide-react';
import { useFocusSafeField } from '@/lib/hooks/use-focus-safe-field';
import { gridCardPalette } from '@/lib/projections/grid-palette';
import type { CalendarEventT } from '@/lib/schemas/calendar-event';

export function EventBlock({
  event,
  style,
  onPersist,
  onDelete,
  onContextMenu,
}: {
  event: CalendarEventT;
  style: CSSProperties;
  onPersist: (id: string, patch: { title: string }) => void;
  onDelete: (id: string) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  const palette = gridCardPalette(event.colorIndex);
  const title = useFocusSafeField(event.title, (value) => onPersist(event.id, { title: value }));

  return (
    <motion.div
      layout
      layoutId={`event-${event.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onContextMenu={onContextMenu}
      style={{
        ...style,
        background: palette.background,
        borderColor: palette.border,
        color: palette.foreground,
      }}
      className="group flex flex-col overflow-hidden rounded-md border p-1 text-left"
    >
      <div className="flex items-start justify-between gap-1">
        <input
          value={title.value}
          onChange={title.onChange}
          onFocus={title.onFocus}
          onBlur={title.onBlur}
          onKeyDown={title.onKeyDown}
          placeholder="Untitled"
          className="w-full truncate bg-transparent text-xs font-medium outline-none placeholder:opacity-50"
        />
        <button
          type="button"
          aria-label="Delete event"
          onClick={() => onDelete(event.id)}
          className="shrink-0 opacity-0 transition-opacity group-hover:opacity-70 hover:opacity-100!"
        >
          <XIcon className="size-3" />
        </button>
      </div>
    </motion.div>
  );
}
