'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVerticalIcon, XIcon } from 'lucide-react';
import { useFocusSafeField } from '@/lib/hooks/use-focus-safe-field';
import type { KanbanCardT } from '@/lib/schemas/kanban-card';
import { cn } from '@/lib/utils';

export function KanbanCard({
  card,
  onPersist,
  onDelete,
  onContextMenu,
}: {
  card: KanbanCardT;
  onPersist: (id: string, patch: { title: string }) => void;
  onDelete: (id: string) => void;
  onContextMenu: (event: React.MouseEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
  });
  const title = useFocusSafeField(card.title, (value) => onPersist(card.id, { title: value }));

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      onContextMenu={onContextMenu}
      className={cn(
        'group flex items-center gap-2 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50',
        isDragging && 'opacity-40',
      )}
    >
      <button
        type="button"
        aria-label="Drag card"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
      >
        <GripVerticalIcon className="size-4" />
      </button>
      <input
        value={title.value}
        onChange={title.onChange}
        onFocus={title.onFocus}
        onBlur={title.onBlur}
        onKeyDown={title.onKeyDown}
        placeholder="Untitled"
        className="flex-1 bg-transparent text-sm font-medium outline-none"
      />
      <button
        type="button"
        aria-label="Delete card"
        onClick={() => onDelete(card.id)}
        className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  );
}
