'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { PresencePeer, RealtimeRoom } from 'trellis/realtime';
import { useSessionRoom } from '@/lib/shell/session-room';
import { getOrCreatePresenceIdentity, type PresenceIdentity } from '@/lib/presence/identity';
import { resolvePresenceRelayUrl } from '@/lib/presence/config';
import type { BoardPresence } from '@/lib/presence/types';
import { useJoinedPresenceRoom } from '@/lib/presence/use-joined-room';
import { usePointerPresence } from '@/lib/presence/use-pointer-presence';

type PresenceContextValue = {
  enabled: boolean;
  sessionRoom: string;
  room: RealtimeRoom<BoardPresence> | null;
  presence: PresencePeer<BoardPresence>[];
  others: PresencePeer<BoardPresence>[];
  identity: PresenceIdentity;
  selfCursor: { x: number; y: number } | null;
  attachSurface: (node: HTMLDivElement | null) => void;
  setCardFocus: (cardId: string | null) => void;
  focusByCardId: Map<string, PresencePeer<BoardPresence>[]>;
};

const PresenceContext = createContext<PresenceContextValue | null>(null);

export function useBoardPresence(): PresenceContextValue | null {
  return useContext(PresenceContext);
}

function PresenceRoomActive({
  sessionRoom,
  children,
}: {
  sessionRoom: string;
  children: ReactNode;
}) {
  const [identity] = useState(() => getOrCreatePresenceIdentity());
  const relayUrl = useMemo(() => resolvePresenceRelayUrl(), []);

  const { room, presence, others, pushPresence, setCardFocus } = useJoinedPresenceRoom({
    peerId: identity.peerId,
    roomName: sessionRoom,
    relayUrl,
    initial: { name: identity.name, color: identity.color },
  });

  const { attachSurface, selfCursor } = usePointerPresence(pushPresence);

  const focusByCardId = useMemo(() => {
    const map = new Map<string, PresencePeer<BoardPresence>[]>();
    for (const peer of presence) {
      const cardId = peer.state.cardId;
      if (!cardId) continue;
      const list = map.get(cardId) ?? [];
      list.push(peer);
      map.set(cardId, list);
    }
    return map;
  }, [presence]);

  const value = useMemo<PresenceContextValue>(
    () => ({
      enabled: true,
      sessionRoom,
      room,
      presence,
      others,
      identity,
      selfCursor,
      attachSurface,
      setCardFocus,
      focusByCardId,
    }),
    [
      sessionRoom,
      room,
      presence,
      others,
      identity,
      selfCursor,
      attachSurface,
      setCardFocus,
      focusByCardId,
    ],
  );

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

export function PresenceRoom({ children }: { children: ReactNode }) {
  const sessionRoom = useSessionRoom();

  if (!sessionRoom) {
    return null;
  }

  return <PresenceRoomActive sessionRoom={sessionRoom}>{children}</PresenceRoomActive>;
}
