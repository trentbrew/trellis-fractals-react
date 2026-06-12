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
  onFocusCard,
  onBlurCard,
  focusHolders,
  readonly = false,
}: {
  card: KanbanCardT;
  onPersist?: (id: string, patch: { title: string }) => void;
  onDelete?: (id: string) => void;
  onContextMenu?: (event: React.MouseEvent) => void;
  onFocusCard?: (cardId: string) => void;
  onBlurCard?: () => void;
  focusHolders?: { name: string; color: string }[];
  readonly?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    disabled: readonly,
  });
  const title = useFocusSafeField(
    card.title,
    (value) => onPersist?.(card.id, { title: value }),
    { debounceMs: 400 },
  );

  const focusColor = focusHolders?.[0]?.color;

  if (readonly) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border bg-card p-3 transition-shadow duration-150',
          focusColor ? 'border-transparent ring-2' : 'border-border',
        )}
        style={focusColor ? { boxShadow: `0 0 0 2px ${focusColor}` } : undefined}
        onContextMenu={(event) => event.preventDefault()}
        title={focusHolders?.map((h) => h.name).join(', ')}
      >
        <span className="flex-1 text-sm font-medium text-foreground">
          {card.title || 'Untitled'}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        ...(focusColor ? { boxShadow: `0 0 0 2px ${focusColor}` } : {}),
      }}
      onContextMenu={onContextMenu}
      className={cn(
        'group flex items-center gap-2 rounded-lg border bg-card p-3 transition-[box-shadow,background-color] duration-150 hover:bg-muted/50',
        focusColor ? 'border-transparent ring-2' : 'border-border',
        isDragging && 'opacity-40',
      )}
      title={focusHolders?.map((h) => h.name).join(', ')}
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
        onFocus={() => {
          title.onFocus();
          onFocusCard?.(card.id);
        }}
        onBlur={() => {
          title.onBlur();
          onBlurCard?.();
        }}
        onKeyDown={title.onKeyDown}
        placeholder="Untitled"
        className="flex-1 bg-transparent text-sm font-medium outline-none"
      />
      <button
        type="button"
        aria-label="Delete card"
        onClick={() => onDelete?.(card.id)}
        className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  );
}
