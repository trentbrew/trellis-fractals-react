'use client';

import { useMemo } from 'react';
import { inferCardGraphLinks } from '@/lib/fractal/force-graph';
import type { CardT } from '@/lib/schemas/card';
import { ForceGraphCanvas } from '@/components/fractals/force-graph-canvas';

export function CardGraphCanvas({
  rows,
  onContextMenu,
}: {
  rows: CardT[];
  onContextMenu: (event: React.MouseEvent, card: CardT) => void;
}) {
  const rowById = useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows]);
  const nodes = useMemo(
    () =>
      rows.map((row) => ({
        id: row.id,
        title: row.title.trim() || 'Untitled card',
        colorIndex: row.colorIndex,
      })),
    [rows],
  );
  const links = useMemo(() => inferCardGraphLinks(rows), [rows]);

  return (
    <ForceGraphCanvas
      nodes={nodes}
      links={links}
      nodeDataAttribute="data-card-id"
      ariaLabel="Card graph"
      testId="card-dot-field"
      emptyMessage="No cards match this view."
      onContextMenu={(event, id) => {
        const card = rowById.get(id);
        if (card) onContextMenu(event, card);
      }}
    />
  );
}
