import type { PresencePeer } from 'trellis/realtime';
import type { BoardPresence } from '@/lib/presence/types';

export type CellFocusHolder = {
  id: string;
  name: string;
  color: string;
  caret?: number | null;
  caretAt?: number | null;
};

export function cellFocusKey(rowId: string, columnKey: string): string {
  return `${rowId}\u0000${columnKey}`;
}

export function buildFocusByCell(
  presence: PresencePeer<BoardPresence>[],
): Map<string, CellFocusHolder[]> {
  const map = new Map<string, CellFocusHolder[]>();
  for (const peer of presence) {
    const rowId = peer.state.cellRowId;
    const columnKey = peer.state.cellKey;
    if (!rowId || !columnKey) continue;
    const key = cellFocusKey(rowId, columnKey);
    const list = map.get(key) ?? [];
    list.push({
      id: peer.id,
      name: peer.state.name,
      color: peer.state.color,
      caret: peer.state.caret,
      caretAt: peer.state.caretAt,
    });
    map.set(key, list);
  }
  return map;
}

export function remoteCellFocusHolders(
  focusByCell: Map<string, CellFocusHolder[]>,
  rowId: string,
  columnKey: string,
  selfPeerId?: string,
): CellFocusHolder[] {
  const holders = focusByCell.get(cellFocusKey(rowId, columnKey)) ?? [];
  if (!selfPeerId) return holders;
  return holders.filter((holder) => holder.id !== selfPeerId);
}

/** Stable key for cells with remote editors — ignores caret moves within a cell. */
export function remoteFocusedCellSlotsKey(
  focusByCell: Map<string, CellFocusHolder[]>,
  selfPeerId: string,
): string {
  const parts: string[] = [];
  for (const [slot, holders] of focusByCell) {
    if (holders.some((holder) => holder.id !== selfPeerId)) {
      parts.push(slot);
    }
  }
  return parts.sort().join('\u0001');
}
