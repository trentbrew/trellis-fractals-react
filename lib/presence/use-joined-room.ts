'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { joinPresence, type PresencePeer, type RealtimeRoom } from 'trellis/realtime';
import { dedupePresencePeers } from '@/lib/presence/dedupe-peers';
import { resolveRelayForJoin } from '@/lib/presence/relay-probe';
import { OFFSCREEN, type BoardPresence } from '@/lib/presence/types';

const EMPTY_PRESENCE: PresencePeer<BoardPresence>[] = [];

export function useJoinedPresenceRoom(opts: {
  peerId: string;
  roomName: string;
  relayUrl?: string;
  initial: Pick<BoardPresence, 'name' | 'color'>;
  enabled?: boolean;
}) {
  const enabled = opts.enabled ?? true;
  const roomRef = useRef<RealtimeRoom<BoardPresence> | null>(null);
  const focusedCardRef = useRef<string | null>(null);
  const focusedCellRowRef = useRef<string | null>(null);
  const focusedCellKeyRef = useRef<string | null>(null);
  const focusedCaretRef = useRef<number | null>(null);
  const focusedCaretAtRef = useRef<number | null>(null);
  const lastCursorRef = useRef({ x: OFFSCREEN, y: OFFSCREEN });
  const awayRef = useRef(false);
  const routeRef = useRef<string | null>(null);
  const profileRef = useRef(opts.initial);
  profileRef.current = opts.initial;

  const [room, setRoom] = useState<RealtimeRoom<BoardPresence> | null>(null);
  const [presence, setPresence] = useState<PresencePeer<BoardPresence>[]>(EMPTY_PRESENCE);

  const joinKey = `${opts.peerId}\0${opts.roomName}\0${opts.relayUrl ?? 'local'}`;

  const snapshot = useCallback((): BoardPresence => {
    const profile = profileRef.current;
    return {
      name: profile.name,
      color: profile.color,
      x: lastCursorRef.current.x,
      y: lastCursorRef.current.y,
      cardId: focusedCardRef.current,
      cellRowId: focusedCellRowRef.current,
      cellKey: focusedCellKeyRef.current,
      caret: focusedCaretRef.current,
      caretAt: focusedCaretAtRef.current,
      away: awayRef.current,
      route: routeRef.current,
    };
  }, []);

  const pushPresence = useCallback(
    (partial: Partial<BoardPresence> = {}) => {
      const active = roomRef.current;
      if (!active) return;

      if (partial.x !== undefined) lastCursorRef.current.x = partial.x;
      if (partial.y !== undefined) lastCursorRef.current.y = partial.y;
      if (partial.cardId !== undefined) focusedCardRef.current = partial.cardId;
      if (partial.cellRowId !== undefined) focusedCellRowRef.current = partial.cellRowId;
      if (partial.cellKey !== undefined) focusedCellKeyRef.current = partial.cellKey;
      if (partial.caret !== undefined) focusedCaretRef.current = partial.caret;
      if (partial.caretAt !== undefined) focusedCaretAtRef.current = partial.caretAt;
      if (partial.away !== undefined) awayRef.current = partial.away ?? false;
      if (partial.route !== undefined) routeRef.current = partial.route;

      active.setPresence({ ...snapshot(), ...partial });
    },
    [snapshot],
  );

  useEffect(() => {
    if (!enabled || !opts.roomName) {
      roomRef.current = null;
      setRoom(null);
      setPresence(EMPTY_PRESENCE);
      return;
    }

    let cancelled = false;
    let joined: RealtimeRoom<BoardPresence> | null = null;
    let unsub: (() => void) | null = null;

    void (async () => {
      const relayUrl = await resolveRelayForJoin(opts.relayUrl);
      if (cancelled) return;

      joined = joinPresence<BoardPresence>({
        peerId: opts.peerId,
        room: opts.roomName,
        relayUrl,
        initialPresence: snapshot(),
      });
      roomRef.current = joined;
      setRoom(joined);

      unsub = joined.presenceSignal.subscribe((peers) => {
        setPresence(dedupePresencePeers(peers));
      });
      joined.setPresence(snapshot());
    })();

    return () => {
      cancelled = true;
      unsub?.();
      joined?.leave();
      if (roomRef.current === joined) roomRef.current = null;
      setRoom(null);
      setPresence(EMPTY_PRESENCE);
    };
    // joinKey captures peer, room, relay changes
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: join only on transport key
  }, [enabled, joinKey, opts.roomName]);

  const setCardFocus = useCallback(
    (cardId: string | null) => {
      focusedCardRef.current = cardId;
      if (cardId !== null) {
        focusedCellRowRef.current = null;
        focusedCellKeyRef.current = null;
        focusedCaretRef.current = null;
        focusedCaretAtRef.current = null;
        pushPresence({
          cardId,
          cellRowId: null,
          cellKey: null,
          caret: null,
          caretAt: null,
        });
        return;
      }
      pushPresence({ cardId: null });
    },
    [pushPresence],
  );

  const setCellFocus = useCallback(
    (
      rowId: string | null,
      key: string | null,
      caret: number | null = null,
      caretAt: number | null = null,
    ) => {
      focusedCardRef.current = null;
      focusedCellRowRef.current = rowId;
      focusedCellKeyRef.current = key;
      focusedCaretRef.current = caret;
      focusedCaretAtRef.current = caretAt;
      if (rowId && key) {
        lastCursorRef.current = { x: OFFSCREEN, y: OFFSCREEN };
      }
      pushPresence({
        cardId: null,
        cellRowId: rowId,
        cellKey: key,
        caret,
        caretAt,
        ...(rowId && key ? { x: OFFSCREEN, y: OFFSCREEN } : {}),
      });
    },
    [pushPresence],
  );

  const others = useMemo(
    () => presence.filter((peer) => !peer.self),
    [presence],
  );

  return {
    room,
    presence,
    others,
    pushPresence,
    setCardFocus,
    setCellFocus,
  };
}
