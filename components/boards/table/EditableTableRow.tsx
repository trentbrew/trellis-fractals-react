'use client';

import { motion } from 'framer-motion';
import { XIcon } from 'lucide-react';
import { TableCell } from '@/components/ui/table';
import { useFocusSafeField } from '@/lib/hooks/use-focus-safe-field';
import type { ColumnDef } from '@/lib/registry/columns';
import type { CardT } from '@/lib/schemas/card';

function EditableCell({
  row,
  column,
  onPersist,
}: {
  row: CardT;
  column: ColumnDef<CardT>;
  onPersist: (id: string, patch: Partial<CardT>) => void;
}) {
  const field = useFocusSafeField(
    String(row[column.key] ?? ''),
    (value) => onPersist(row.id, { [column.key]: value } as Partial<CardT>),
    { debounceMs: column.key === 'title' ? 400 : undefined },
  );

  return (
    <TableCell className="p-0">
      <input
        value={field.value}
        onChange={field.onChange}
        onFocus={field.onFocus}
        onBlur={field.onBlur}
        onKeyDown={field.onKeyDown}
        placeholder={column.label}
        className="w-full bg-transparent px-3 py-2 text-sm outline-none focus:bg-muted/50"
      />
    </TableCell>
  );
}

export function EditableTableRow({
  row,
  columns,
  onPersist,
  onDelete,
  onContextMenu,
}: {
  row: CardT;
  columns: ColumnDef<CardT>[];
  onPersist: (id: string, patch: Partial<CardT>) => void;
  onDelete: (id: string) => void;
  onContextMenu: (event: React.MouseEvent) => void;
}) {
  return (
    <motion.tr
      layout
      layoutId={`row-${row.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onContextMenu={onContextMenu}
      className="group border-b border-border/50 transition-colors hover:bg-muted/30"
    >
      {columns.map((column) => (
        <EditableCell key={column.key} row={row} column={column} onPersist={onPersist} />
      ))}
      <TableCell className="w-10 p-0 text-right">
        <button
          type="button"
          aria-label="Delete row"
          onClick={() => onDelete(row.id)}
          className="mr-2 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
        >
          <XIcon className="size-4" />
        </button>
      </TableCell>
    </motion.tr>
  );
}
