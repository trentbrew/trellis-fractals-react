'use client';

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { joinPresence, type PresencePeer, type RealtimeRoom } from 'trellis/realtime';
import { OFFSCREEN, type BoardPresence } from '@/lib/presence/types';

const EMPTY_PRESENCE: PresencePeer<BoardPresence>[] = [];

export function useJoinedPresenceRoom(opts: {
  peerId: string;
  roomName: string;
  relayUrl?: string;
  initial: Pick<BoardPresence, 'name' | 'color'>;
}) {
  const roomRef = useRef<RealtimeRoom<BoardPresence> | null>(null);
  const focusedCardRef = useRef<string | null>(null);
  const lastCursorRef = useRef({ x: OFFSCREEN, y: OFFSCREEN });
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
    };
  }, []);

  const pushPresence = useCallback(
    (partial: Partial<BoardPresence> = {}) => {
      const active = roomRef.current;
      if (!active) return;

      if (partial.x !== undefined) lastCursorRef.current.x = partial.x;
      if (partial.y !== undefined) lastCursorRef.current.y = partial.y;
      if (partial.cardId !== undefined) focusedCardRef.current = partial.cardId;

      active.setPresence({ ...snapshot(), ...partial });
    },
    [snapshot],
  );

  useLayoutEffect(() => {
    const joined = joinPresence<BoardPresence>({
      peerId: opts.peerId,
      room: opts.roomName,
      relayUrl: opts.relayUrl,
      initialPresence: snapshot(),
    });
    roomRef.current = joined;
    setRoom(joined);

    const unsub = joined.presenceSignal.subscribe(setPresence);
    joined.setPresence(snapshot());

    return () => {
      unsub();
      joined.leave();
      if (roomRef.current === joined) roomRef.current = null;
      setRoom(null);
      setPresence(EMPTY_PRESENCE);
    };
    // joinKey captures peer, room, relay changes
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: join only on transport key
  }, [joinKey]);

  const setCardFocus = useCallback(
    (cardId: string | null) => {
      focusedCardRef.current = cardId;
      pushPresence({ cardId });
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
  };
}
