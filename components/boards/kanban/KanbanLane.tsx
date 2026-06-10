'use client';

import { useDroppable } from '@dnd-kit/core';
import type { KanbanCardT } from '@/lib/schemas/kanban-card';
import type { LaneDef } from '@/lib/projections/resolvers/lane';
import { cn } from '@/lib/utils';
import { KanbanCard } from './KanbanCard';

export function KanbanLane({
  lane,
  cards,
  onPersist,
  onDelete,
  onContextMenu,
}: {
  lane: LaneDef;
  cards: KanbanCardT[];
  onPersist: (id: string, patch: { title: string }) => void;
  onDelete: (id: string) => void;
  onContextMenu: (event: React.MouseEvent, entityId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: lane.id });

  return (
    <div className="flex min-w-64 flex-1 flex-col gap-2 rounded-xl border border-border bg-muted/20 p-2">
      <div className="flex items-center justify-between px-1 py-1">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {lane.label}
        </h2>
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {cards.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-24 flex-1 flex-col gap-2 rounded-lg p-1 transition-colors',
          isOver && 'bg-primary/5 ring-1 ring-primary/30',
        )}
      >
        {cards.map((card) => (
          <KanbanCard
            key={card.id}
            card={card}
            onPersist={onPersist}
            onDelete={onDelete}
            onContextMenu={(event) => onContextMenu(event, card.id)}
          />
        ))}
        {cards.length === 0 && (
          <p className="px-1 py-2 text-xs text-muted-foreground">No cards</p>
        )}
      </div>
    </div>
  );
}
