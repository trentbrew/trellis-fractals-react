'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useCollection } from '@/lib/trellis/use-collection';
import { Card, type CardT } from '@/lib/schemas/card';
import { applyCollectionBrowse, defaultBrowseState, type BrowseState } from '@/lib/browse/apply';
import { getBrowseConfig, tableColumnsFromBrowseConfig } from '@/lib/registry/browse-config';
import { ProjectionHeader } from '@/components/shell/ProjectionHeader';
import { CollectionBrowseBar } from '@/components/shell/CollectionBrowseBar';
import { CollectionViewHint } from '@/components/shell/CollectionViewHint';
import { AddRecordButton } from '@/components/shell/AddRecordButton';
import { useEntityContextMenu } from '@/components/shell/EntityContextMenu';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EditableTableRow } from './EditableTableRow';

const browseConfig = getBrowseConfig<CardT>(Card);
const columns = tableColumnsFromBrowseConfig(Card, browseConfig);

export function TableBoard() {
  const { rows, mut } = useCollection(Card);
  const [browseState, setBrowseState] = useState<BrowseState>(() => defaultBrowseState(browseConfig));

  const browsedRows = useMemo(
    () => applyCollectionBrowse(rows, browseState, browseConfig),
    [rows, browseState],
  );

  const { openAt, menu } = useEntityContextMenu((action, entityId) => {
    if (action === 'delete') void mut.remove(entityId);
  });

  async function addRow() {
    await mut.create({ title: '', body: '', colorIndex: rows.length % 16 });
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <ProjectionHeader title="Table">
        <CollectionViewHint schema={Card} current="table" />
        <CollectionBrowseBar
          config={browseConfig}
          state={browseState}
          resultCount={browsedRows.length}
          totalCount={rows.length}
          onChange={(patch) => setBrowseState((prev) => ({ ...prev, ...patch }))}
        />
        <AddRecordButton label="New row" onClick={addRow} />
      </ProjectionHeader>

      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className="py-2 px-3 text-xs font-medium text-muted-foreground"
                >
                  {column.label}
                </TableHead>
              ))}
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence initial={false}>
              {browsedRows.map((row) => (
                <EditableTableRow
                  key={row.id}
                  row={row}
                  columns={columns}
                  onPersist={(id, patch) => void mut.update(id, patch)}
                  onDelete={(id) => void mut.remove(id)}
                  onContextMenu={(event) => openAt(event, row.id)}
                />
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
        {browsedRows.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">
            {rows.length === 0 ? 'No rows yet — add one above.' : 'No matches — try another search.'}
          </p>
        )}
      </div>
      {menu}
    </div>
  );
}
