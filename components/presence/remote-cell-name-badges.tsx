'use client';

import type { CellFocusHolder } from '@/lib/presence/cell-focus';

/** Peer name chips anchored outside the bottom-left of a spreadsheet cell. */
export function RemoteCellNameBadges({ holders }: { holders: CellFocusHolder[] }) {
  if (holders.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute top-full left-0 z-[90] flex flex-col items-start gap-px pt-px"
      aria-hidden
    >
      {holders.map((holder) => (
        <span
          key={holder.id}
          className="whitespace-nowrap rounded px-1 py-0.5 text-[10px] font-medium leading-none text-white shadow-sm"
          style={{ backgroundColor: holder.color }}
        >
          {holder.name}
        </span>
      ))}
    </div>
  );
}
