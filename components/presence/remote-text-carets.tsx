'use client';

import type { CellFocusHolder } from '@/lib/presence/cell-focus';

type RemoteTextCaretsProps = {
  holders: CellFocusHolder[];
  textLength: number;
  className?: string;
};

export function RemoteTextCarets({ holders, textLength, className }: RemoteTextCaretsProps) {
  if (holders.length === 0) return null;

  return (
    <>
      {holders.map((holder) => {
        const caret = holder.caret ?? 0;
        const ratio = textLength > 0 ? Math.min(1, Math.max(0, caret / textLength)) : 0;
        return (
          <span
            key={holder.id}
            className={className}
            style={{
              position: 'absolute',
              top: 2,
              bottom: 2,
              left: `calc(0.5rem + (100% - 1rem) * ${ratio})`,
              width: 2,
              backgroundColor: holder.color,
              pointerEvents: 'none',
              zIndex: 50,
            }}
            title={holder.name}
            aria-hidden
          />
        );
      })}
    </>
  );
}
