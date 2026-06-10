'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCollection } from '@/lib/trellis/use-collection';
import { Card, type CardT } from '@/lib/schemas/card';
import { applyCollectionBrowse, defaultBrowseState, type BrowseState } from '@/lib/browse/apply';
import { getBrowseConfig } from '@/lib/registry/browse-config';
import { ProjectionHeader } from '@/components/shell/ProjectionHeader';
import { CollectionBrowseBar } from '@/components/shell/CollectionBrowseBar';
import { CollectionViewHint } from '@/components/shell/CollectionViewHint';
import { AddRecordButton } from '@/components/shell/AddRecordButton';
import { useEntityContextMenu } from '@/components/shell/EntityContextMenu';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { GridCard } from './GridCard';

const browseConfig = getBrowseConfig<CardT>(Card);
const COLS_OPTIONS = [3, 4, 5] as const;

export function GridBoard() {
  const { rows, mut } = useCollection(Card);
  const [browseState, setBrowseState] = useState<BrowseState>(() => defaultBrowseState(browseConfig));
  const [cols, setCols] = useState(4);
  const [focusCardId, setFocusCardId] = useState<string | null>(null);

  const browsedRows = useMemo(
    () => applyCollectionBrowse(rows, browseState, browseConfig),
    [rows, browseState],
  );

  const { openAt, menu } = useEntityContextMenu((action, entityId) => {
    if (action === 'delete') void mut.remove(entityId);
  });

  async function addCard() {
    const id = await mut.create({ title: '', body: '', colorIndex: rows.length % 16 });
    setFocusCardId(id);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <ProjectionHeader title="Grid">
        <CollectionViewHint schema={Card} current="card-grid" />
        <CollectionBrowseBar
          config={browseConfig}
          state={browseState}
          resultCount={browsedRows.length}
          totalCount={rows.length}
          onChange={(patch) => setBrowseState((prev) => ({ ...prev, ...patch }))}
        />
        <ToggleGroup
          value={[String(cols)]}
          onValueChange={(value) => {
            const next = Number(value[0]);
            if (Number.isFinite(next)) setCols(next);
          }}
          variant="outline"
          size="sm"
        >
          {COLS_OPTIONS.map((option) => (
            <ToggleGroupItem key={option} value={String(option)} aria-label={`${option} columns`}>
              {option}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <AddRecordButton label="New card" onClick={addCard} />
      </ProjectionHeader>

      <motion.div
        layout
        style={{ '--cols': cols } as React.CSSProperties}
        className="grid grid-cols-[repeat(var(--cols),1fr)] gap-4"
      >
        <AnimatePresence initial={false}>
          {browsedRows.map((card) => (
            <GridCard
              key={card.id}
              card={card}
              autoFocus={card.id === focusCardId}
              onAutoFocused={() => setFocusCardId(null)}
              onPersist={(id, patch) => void mut.update(id, patch)}
              onDelete={(id) => void mut.remove(id)}
              onContextMenu={(event) => openAt(event, card.id)}
            />
          ))}
        </AnimatePresence>
        {browsedRows.length === 0 && (
          <p className="col-span-full text-sm text-muted-foreground">
            {rows.length === 0 ? 'No cards yet — add one above.' : 'No matches — try another search.'}
          </p>
        )}
      </motion.div>
      {menu}
    </div>
  );
}
