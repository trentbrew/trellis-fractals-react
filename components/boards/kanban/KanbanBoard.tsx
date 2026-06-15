'use client';

import { useMemo, useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, closestCorners, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useCollection } from '@/lib/trellis/use-collection';
import { KanbanCard, type KanbanCardT, type KanbanStatus } from '@/lib/schemas/kanban-card';
import { applyCollectionFilter, defaultBrowseState, type BrowseState } from '@/lib/browse/apply';
import { getBrowseConfig } from '@/lib/registry/browse-config';
import { DEFAULT_KANBAN_LANES, groupByLane, sortLaneCards } from '@/lib/projections/resolvers/lane';
import { BrowseProjectionShell } from '@/components/shell/browse-projection-shell';
import { ProjectionHeader } from '@/components/shell/ProjectionHeader';
import { CollectionBrowseBar } from '@/components/shell/CollectionBrowseBar';
import { AddRecordButton } from '@/components/shell/AddRecordButton';
import { useEntityContextMenu } from '@/components/shell/EntityContextMenu';
import { useEmbedFlags } from '@/lib/shell/use-embed-flags';
import { useBoardPresence } from '@/lib/presence/context';
import { BoardPresenceSurface } from '@/components/presence/board-presence-surface';
import { KanbanLane } from './KanbanLane';

const browseConfig = getBrowseConfig<KanbanCardT>(KanbanCard);

function focusHolderMap(
  focusByCardId: NonNullable<ReturnType<typeof useBoardPresence>>['focusByCardId'],
): Map<string, { name: string; color: string }[]> {
  const map = new Map<string, { name: string; color: string }[]>();
  for (const [cardId, peers] of focusByCardId) {
    map.set(
      cardId,
      peers.map((peer) => ({ name: peer.state.name, color: peer.state.color })),
    );
  }
  return map;
}

function KanbanBoardReadonly({
  lanes,
  filteredCount,
  totalCount,
  browseState,
  onBrowseChange,
}: {
  lanes: ReturnType<typeof groupByLane>;
  filteredCount: number;
  totalCount: number;
  browseState: BrowseState;
  onBrowseChange: (patch: Partial<BrowseState>) => void;
}) {
  const presence = useBoardPresence();
  const focusByCardId = useMemo(
    () => (presence ? focusHolderMap(presence.focusByCardId) : undefined),
    [presence],
  );

  return (
    <BrowseProjectionShell className="gap-4">
      <ProjectionHeader title="Kanban">
        <CollectionBrowseBar
          config={browseConfig}
          state={browseState}
          resultCount={filteredCount}
          totalCount={totalCount}
          onChange={(patch) => onBrowseChange(patch)}
        />
      </ProjectionHeader>
      <BoardPresenceSurface>
        <div className="flex w-full gap-4 overflow-x-auto pb-2">
          {DEFAULT_KANBAN_LANES.map((lane) => (
            <KanbanLane
              key={lane.id}
              lane={lane}
              cards={lanes[lane.id]}
              readonly
              focusByCardId={focusByCardId}
            />
          ))}
        </div>
      </BoardPresenceSurface>
    </BrowseProjectionShell>
  );
}

function KanbanBoardInner() {
  const { readonly } = useEmbedFlags();
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
  const presence = useBoardPresence();
  const focusByCardId = useMemo(
    () => (presence ? focusHolderMap(presence.focusByCardId) : undefined),
    [presence],
  );
  const { openAt, menu } = useEntityContextMenu((action, entityId) => {
    if (action === 'delete') void mut.remove(entityId);
  });

  if (readonly) {
    return (
      <KanbanBoardReadonly
        lanes={lanes}
        filteredCount={filteredRows.length}
        totalCount={rows.length}
        browseState={browseState}
        onBrowseChange={(patch) => setBrowseState((prev) => ({ ...prev, ...patch }))}
      />
    );
  }

  async function addCard() {
    await mut.create({ title: '', status: 'backlog' });
  }

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    setActiveId(id);
    presence?.setCardFocus(id);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    presence?.setCardFocus(null);
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
    <BrowseProjectionShell className="gap-4">
      <ProjectionHeader title="Kanban">
        <CollectionBrowseBar
          config={browseConfig}
          state={browseState}
          resultCount={filteredRows.length}
          totalCount={rows.length}
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
        <BoardPresenceSurface>
          <div className="flex w-full gap-4 overflow-x-auto pb-2">
            {DEFAULT_KANBAN_LANES.map((lane) => (
              <KanbanLane
                key={lane.id}
                lane={lane}
                cards={lanes[lane.id]}
                onPersist={(id, patch) => void mut.update(id, patch)}
                onDelete={(id) => void mut.remove(id)}
                onContextMenu={(event, entityId) => openAt(event, entityId)}
                onFocusCard={(cardId) => presence?.setCardFocus(cardId)}
                onBlurCard={() => presence?.setCardFocus(null)}
                focusByCardId={focusByCardId}
              />
            ))}
          </div>
        </BoardPresenceSurface>
        <DragOverlay>
          {activeCard && (
            <div className="rounded-lg border border-border bg-card p-3 text-sm font-medium shadow-lg">
              {activeCard.title || 'Untitled'}
            </div>
          )}
        </DragOverlay>
      </DndContext>
      {menu}
    </BrowseProjectionShell>
  );
}

export function KanbanBoard() {
  return <KanbanBoardInner />;
}
