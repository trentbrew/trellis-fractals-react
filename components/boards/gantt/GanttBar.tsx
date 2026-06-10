'use client';

import { useRef, useState, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { XIcon } from 'lucide-react';
import { useFocusSafeField } from '@/lib/hooks/use-focus-safe-field';
import { gridCardPalette } from '@/lib/projections/grid-palette';
import { endFromTrackX, type GanttMetrics } from '@/lib/projections/resolvers/gantt';
import type { WeekViewState } from '@/lib/projections/resolvers/interval';
import type { GanttTaskT } from '@/lib/schemas/gantt-task';

export function GanttBar({
  task,
  style,
  view,
  metrics,
  trackRef,
  onPersist,
  onDelete,
  onContextMenu,
}: {
  task: GanttTaskT;
  style: CSSProperties;
  view: WeekViewState;
  metrics: GanttMetrics;
  trackRef: React.RefObject<HTMLDivElement | null>;
  onPersist: (id: string, patch: { title?: string; end?: string }) => void;
  onDelete: (id: string) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  const palette = gridCardPalette(task.colorIndex);
  const title = useFocusSafeField(task.title, (value) => onPersist(task.id, { title: value }));
  const [previewWidth, setPreviewWidth] = useState<number | null>(null);
  const dragging = useRef(false);

  function startResize(event: React.PointerEvent) {
    event.preventDefault();
    event.stopPropagation();
    dragging.current = true;

    const trackRect = trackRef.current?.getBoundingClientRect();
    if (!trackRect) return;
    const left = typeof style.left === 'number' ? style.left : 0;

    const onMove = (moveEvent: PointerEvent) => {
      const nextEnd = endFromTrackX(moveEvent.clientX, trackRect, view, task.start);
      const ratio =
        (new Date(nextEnd).getTime() - view.weekStart.getTime()) /
        (7 * 86_400_000);
      const width = Math.max(ratio * metrics.trackWidth - left, 28);
      setPreviewWidth(width);
    };

    const onUp = (upEvent: PointerEvent) => {
      dragging.current = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      const nextEnd = endFromTrackX(upEvent.clientX, trackRect, view, task.start);
      setPreviewWidth(null);
      onPersist(task.id, { end: nextEnd });
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  return (
    <motion.div
      layout
      layoutId={`gantt-${task.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onContextMenu={onContextMenu}
      style={{
        ...style,
        width: previewWidth ?? style.width,
        background: palette.background,
        borderColor: palette.border,
        color: palette.foreground,
      }}
      className="group flex items-center gap-1 overflow-hidden rounded-md border px-2"
    >
      <input
        value={title.value}
        onChange={title.onChange}
        onFocus={title.onFocus}
        onBlur={title.onBlur}
        onKeyDown={title.onKeyDown}
        placeholder="Untitled"
        className="min-w-0 flex-1 truncate bg-transparent text-xs font-medium outline-none placeholder:opacity-50"
      />
      <button
        type="button"
        aria-label="Delete task"
        onClick={() => onDelete(task.id)}
        className="shrink-0 opacity-0 transition-opacity group-hover:opacity-70 hover:opacity-100!"
      >
        <XIcon className="size-3" />
      </button>
      <div
        role="presentation"
        onPointerDown={startResize}
        className="absolute top-0 right-0 h-full w-1.5 cursor-ew-resize"
      />
    </motion.div>
  );
}
