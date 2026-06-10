'use client';

import { useMemo, useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, closestCorners, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useCollection } from '@/lib/trellis/use-collection';
import { KanbanCard, type KanbanCardT, type KanbanStatus } from '@/lib/schemas/kanban-card';
import { applyCollectionFilter, defaultBrowseState, type BrowseState } from '@/lib/browse/apply';
import { getBrowseConfig } from '@/lib/registry/browse-config';
import { DEFAULT_KANBAN_LANES, groupByLane, sortLaneCards } from '@/lib/projections/resolvers/lane';
import { ProjectionHeader } from '@/components/shell/ProjectionHeader';
import { CollectionBrowseBar } from '@/components/shell/CollectionBrowseBar';
import { CollectionViewHint } from '@/components/shell/CollectionViewHint';
import { AddRecordButton } from '@/components/shell/AddRecordButton';
import { useEntityContextMenu } from '@/components/shell/EntityContextMenu';
import { KanbanLane } from './KanbanLane';

const browseConfig = getBrowseConfig<KanbanCardT>(KanbanCard);

export function KanbanBoard() {
  const { rows, mut } = useCollection(KanbanCard);
  const [browseState, setBrowseState] = useState<BrowseState>(() => defaultBrowseState(browseConfig));
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const filteredRows = useMemo(
    () => applyCollectionFilter(rows, browseState, browseConfig),
    [rows, browseState],
  );
  const sortedRows = useMemo(
    () => sortLaneCards(filteredRows, { state: browseState, config: browseConfig }),
    [filteredRows, browseState],
  );
  const lanes = useMemo(() => groupByLane(sortedRows), [sortedRows]);
  const activeCard = activeId ? (rows.find((row) => row.id === activeId) ?? null) : null;

  const { openAt, menu } = useEntityContextMenu((action, entityId) => {
    if (action === 'delete') void mut.remove(entityId);
  });

  async function addCard() {
    await mut.create({ title: '', status: 'backlog' });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const card = rows.find((row) => row.id === active.id);
    if (!card) return;

    const overId = String(over.id);
    const targetLane = DEFAULT_KANBAN_LANES.find((lane) => lane.id === overId)
      ? (overId as KanbanStatus)
      : (rows.find((row) => row.id === overId)?.status ?? null);

    if (targetLane && targetLane !== card.status) {
      void mut.update(card.id, { status: targetLane });
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <ProjectionHeader title="Kanban">
        <CollectionViewHint schema={KanbanCard} current="kanban" />
        <CollectionBrowseBar
          config={browseConfig}
          state={browseState}
          onChange={(patch) => setBrowseState((prev) => ({ ...prev, ...patch }))}
        />
        <AddRecordButton label="New card" onClick={addCard} />
      </ProjectionHeader>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex w-full gap-4 overflow-x-auto pb-2">
          {DEFAULT_KANBAN_LANES.map((lane) => (
            <KanbanLane
              key={lane.id}
              lane={lane}
              cards={lanes[lane.id]}
              onPersist={(id, patch) => void mut.update(id, patch)}
              onDelete={(id) => void mut.remove(id)}
              onContextMenu={(event, entityId) => openAt(event, entityId)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeCard && (
            <div className="rounded-lg border border-border bg-card p-3 text-sm font-medium shadow-lg">
              {activeCard.title || 'Untitled'}
            </div>
          )}
        </DragOverlay>
      </DndContext>
      {menu}
    </div>
  );
}
