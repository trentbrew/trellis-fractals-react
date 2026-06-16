'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { CellFocusHolder } from '@/lib/presence/cell-focus';
import {
  isRemoteCellCaretVisible,
  measureCaretInField,
} from '@/lib/presence/text-editing';

type MeasuredCaret = {
  id: string;
  name: string;
  color: string;
  top: number;
  left: number;
};

type MeasuredRemoteCaretsProps = {
  holders: CellFocusHolder[];
  /** Live cell text — remote caret indices are code points into this string. */
  text: string;
  /** Classes copied onto a hidden mirror input (must match the visible cell). */
  mirrorClassName?: string;
};

const MIRROR_BASE =
  'pointer-events-none absolute inset-0 h-full w-full opacity-0 border-0 shadow-none outline-none';

export function MeasuredRemoteCarets({
  holders,
  text,
  mirrorClassName,
}: MeasuredRemoteCaretsProps) {
  const mirrorRef = useRef<HTMLInputElement>(null);
  const [measured, setMeasured] = useState<MeasuredCaret[]>([]);

  useEffect(() => {
    const measure = () => {
      const field = mirrorRef.current;
      const visible = holders.filter((holder) => isRemoteCellCaretVisible(holder));
      if (!field || visible.length === 0) {
        setMeasured([]);
        return;
      }

      const next: MeasuredCaret[] = [];
      for (const holder of visible) {
        const pos = measureCaretInField(field, holder.caret ?? 0);
        if (!pos) continue;
        next.push({
          id: holder.id,
          name: holder.name,
          color: holder.color,
          top: pos.top,
          left: pos.left,
        });
      }
      setMeasured(next);
    };

    measure();
    const tick = setInterval(measure, 500);
    return () => clearInterval(tick);
  }, [holders, text]);

  const hasVisible = holders.some((holder) => isRemoteCellCaretVisible(holder));
  if (!hasVisible) return null;

  return (
    <>
      <input
        ref={mirrorRef}
        readOnly
        tabIndex={-1}
        aria-hidden
        value={text}
        className={cn(MIRROR_BASE, mirrorClassName)}
      />
      <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
        {measured.map((caret) => (
          <div
            key={caret.id}
            className="absolute z-[80] h-[1.2em] w-0.5"
            style={{
              top: caret.top,
              left: caret.left,
              backgroundColor: caret.color,
            }}
            title={caret.name}
          />
        ))}
      </div>
    </>
  );
}
