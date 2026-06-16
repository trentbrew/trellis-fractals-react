'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RealtimeText, type RealtimeRoom } from 'trellis/realtime';
import { cellFocusKey } from '@/lib/presence/cell-focus';
import { textDiff } from '@/lib/presence/text-editing';

type CellDocEntry = {
  doc: RealtimeText;
  last: string;
  applying: boolean;
  refs: number;
  unsub: () => void;
};

function setDocContent(entry: CellDocEntry, text: string): void {
  const current = entry.doc.toString();
  if (current === text) {
    entry.last = text;
    return;
  }
  entry.applying = true;
  if (current.length > 0) entry.doc.delete(0, current.length);
  if (text.length > 0) entry.doc.insert(0, text);
  entry.last = entry.doc.toString();
  entry.applying = false;
}

function clearDocContent(entry: CellDocEntry): void {
  setDocContent(entry, '');
}

function cellTextChannel(slot: string): string {
  return `cell-text:${slot}`;
}

export function useCellTextSync(room: RealtimeRoom | null, peerId: string) {
  const docsRef = useRef(new Map<string, CellDocEntry>());
  const reconcileTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const [cellTexts, setCellTexts] = useState<Record<string, string>>({});

  const publishText = useCallback((slot: string, text: string) => {
    setCellTexts((prev) => (prev[slot] === text ? prev : { ...prev, [slot]: text }));
  }, []);

  const ensureDoc = useCallback(
    (rowId: string, columnKey: string): CellDocEntry | null => {
      if (!room) return null;
      const slot = cellFocusKey(rowId, columnKey);
      const existing = docsRef.current.get(slot);
      if (existing) {
        existing.refs += 1;
        return existing;
      }

      const doc = new RealtimeText({
        peerId,
        room,
        channel: cellTextChannel(slot),
      });

      const entry: CellDocEntry = {
        doc,
        last: doc.toString(),
        applying: false,
        refs: 1,
        unsub: doc.onChange((next) => {
          const current = docsRef.current.get(slot);
          if (!current || current.applying) return;
          current.last = next;
          publishText(slot, next);
        }),
      };

      docsRef.current.set(slot, entry);
      publishText(slot, entry.last);
      return entry;
    },
    [peerId, publishText, room],
  );

  const cancelReconcile = useCallback((slot: string) => {
    const timer = reconcileTimersRef.current.get(slot);
    if (timer) {
      clearTimeout(timer);
      reconcileTimersRef.current.delete(slot);
    }
  }, []);

  const scheduleAuthoritativeReconcile = useCallback(
    (slot: string, seed: string) => {
      cancelReconcile(slot);
      const timer = setTimeout(() => {
        reconcileTimersRef.current.delete(slot);
        const entry = docsRef.current.get(slot);
        if (!entry) return;
        if (entry.doc.toString() === seed) return;
        setDocContent(entry, seed);
        publishText(slot, entry.last);
      }, 48);
      reconcileTimersRef.current.set(slot, timer);
    },
    [cancelReconcile, publishText],
  );

  const releaseDoc = useCallback(
    (rowId: string, columnKey: string) => {
      const slot = cellFocusKey(rowId, columnKey);
      cancelReconcile(slot);
      const entry = docsRef.current.get(slot);
      if (!entry) return;
      entry.refs -= 1;
      if (entry.refs > 0) return;
      clearDocContent(entry);
      entry.unsub();
      entry.doc.dispose();
      docsRef.current.delete(slot);
      setCellTexts((prev) => {
        if (!(slot in prev)) return prev;
        const next = { ...prev };
        delete next[slot];
        return next;
      });
    },
    [cancelReconcile],
  );

  const beginEdit = useCallback(
    (
      rowId: string,
      columnKey: string,
      seed: string,
      opts?: { reset?: boolean },
    ): string => {
      const entry = ensureDoc(rowId, columnKey);
      if (!entry) return seed;
      const slot = cellFocusKey(rowId, columnKey);

      if (opts?.reset) {
        setDocContent(entry, seed);
        publishText(slot, entry.last);
        scheduleAuthoritativeReconcile(slot, seed);
        return entry.last || seed;
      }

      const current = entry.doc.toString();
      if (current === '' && seed) {
        setDocContent(entry, seed);
        publishText(slot, entry.last);
        return entry.last;
      }
      return current || seed;
    },
    [ensureDoc, publishText, scheduleAuthoritativeReconcile],
  );

  const applyLocalEdit = useCallback((rowId: string, columnKey: string, next: string) => {
    const slot = cellFocusKey(rowId, columnKey);
    const entry = docsRef.current.get(slot);
    if (!entry) return;
    entry.applying = true;
    const d = textDiff(entry.last, next);
    if (d.removed > 0) entry.doc.delete(d.index, d.removed);
    if (d.inserted) entry.doc.insert(d.index, d.inserted);
    entry.last = entry.doc.toString();
    entry.applying = false;
    publishText(slot, entry.last);
  }, [publishText]);

  const watchCell = useCallback(
    (rowId: string, columnKey: string) => {
      ensureDoc(rowId, columnKey);
      return () => releaseDoc(rowId, columnKey);
    },
    [ensureDoc, releaseDoc],
  );

  const getCellText = useCallback(
    (rowId: string, columnKey: string) => cellTexts[cellFocusKey(rowId, columnKey)],
    [cellTexts],
  );

  useEffect(() => {
    const docs = docsRef.current;
    const timers = reconcileTimersRef.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
      for (const entry of docs.values()) {
        entry.unsub();
        entry.doc.dispose();
      }
      docs.clear();
    };
  }, [room]);

  return useMemo(
    () => ({
      beginEdit,
      applyLocalEdit,
      watchCell,
      releaseDoc,
      getCellText,
      cellTexts,
    }),
    [applyLocalEdit, beginEdit, cellTexts, getCellText, releaseDoc, watchCell],
  );
}
