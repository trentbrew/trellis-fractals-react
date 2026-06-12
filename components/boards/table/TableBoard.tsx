'use client';

import { useMemo } from 'react';
import { useCollection } from '@/lib/trellis/use-collection';
import { Card, type CardT } from '@/lib/schemas/card';
import { BrowseProjectionShell } from '@/components/shell/browse-projection-shell';
import { ProjectionHeader } from '@/components/shell/ProjectionHeader';
import { CollectionViewHint } from '@/components/shell/CollectionViewHint';
import { useEntityContextMenu } from '@/components/shell/EntityContextMenu';
import {
  SpreadsheetTable,
  type SpreadsheetColumn,
  type SpreadsheetRow,
} from '@/components/boards/spreadsheet/SpreadsheetTable';

const columns: SpreadsheetColumn[] = [
  { key: 'title', label: 'Title', kind: 'text', width: 240, required: true },
  { key: 'body', label: 'Description', kind: 'longtext', width: 420 },
];

export function TableBoard() {
  const { rows, mut } = useCollection(Card);
  const spreadsheetRows = useMemo<SpreadsheetRow[]>(
    () =>
      rows.map((row) => ({
        id: row.id,
        type: row.type,
        values: row as Record<string, unknown>,
      })),
    [rows],
  );

  const { openAt, menu } = useEntityContextMenu((action, entityId) => {
    if (action === 'delete') void mut.remove(entityId);
  });

  async function addRow() {
    await mut.create({ title: '', body: '', colorIndex: rows.length % 16 });
  }

  async function updateCell(id: string, key: string, value: unknown) {
    if (key !== 'title' && key !== 'body') return;
    await mut.update(id, { [key]: value == null ? '' : String(value) } as Partial<CardT>);
  }

  return (
    <BrowseProjectionShell className="min-h-0 flex-1 gap-4">
      <ProjectionHeader title="Table">
        <CollectionViewHint schema={Card} current="table" />
      </ProjectionHeader>
      <div className="flex min-h-0 flex-1 flex-col">
        <SpreadsheetTable
          tableId="demo-card-table"
          rows={spreadsheetRows}
          columns={columns}
          createLabel="New row"
          emptyTitle="No rows yet"
          emptyDescription="Add a row to start editing this table."
          onCreateRow={addRow}
          onUpdateCell={updateCell}
          onDeleteRow={(id) => void mut.remove(id)}
          onRowContextMenu={(event, row) => openAt(event, row.id)}
        />
      </div>
      {menu}
    </BrowseProjectionShell>
  );
}
