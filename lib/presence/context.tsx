'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import type { PresencePeer, RealtimeRoom } from 'trellis/realtime';
import { useSessionRoom } from '@/lib/shell/session-room';
import { getOrCreatePresenceIdentity, type PresenceIdentity } from '@/lib/presence/identity';
import { resolvePresenceRelayUrl, scopedPresenceRoom, navPresenceRoom, presenceRouteKey } from '@/lib/presence/config';
import type { BoardPresence } from '@/lib/presence/types';
import { buildFocusByCell, type CellFocusHolder } from '@/lib/presence/cell-focus';
import { useJoinedPresenceRoom } from '@/lib/presence/use-joined-room';
import { usePointerPresence } from '@/lib/presence/use-pointer-presence';
import { usePresencePeerToasts } from '@/lib/presence/use-presence-peer-toasts';
import { useTabVisibilityPresence } from '@/lib/presence/use-tab-visibility-presence';

type PresenceContextValue = {
  enabled: boolean;
  sessionRoom: string;
  presenceRoute: string;
  room: RealtimeRoom<BoardPresence> | null;
  presence: PresencePeer<BoardPresence>[];
  others: PresencePeer<BoardPresence>[];
  identity: PresenceIdentity;
  selfCursor: { x: number; y: number } | null;
  setCardFocus: (cardId: string | null) => void;
  setCellFocus: (
    rowId: string | null,
    key: string | null,
    caret?: number | null,
    caretAt?: number | null,
  ) => void;
  focusByCardId: Map<string, PresencePeer<BoardPresence>[]>;
  focusByCell: Map<string, CellFocusHolder[]>;
  /** Session-wide peers for icon-rail badges (excludes self). */
  navPeers: PresencePeer<BoardPresence>[];
  /** All peers in the session room (any page), including self. */
  sessionPresence: PresencePeer<BoardPresence>[];
};

const PresenceContext = createContext<PresenceContextValue | null>(null);

export function useBoardPresence(): PresenceContextValue | null {
  return useContext(PresenceContext);
}

function PresenceRoomActive({
  sessionRoom,
  children,
}: {
  sessionRoom: string | null;
  children: ReactNode;
}) {
  const [identity, setIdentity] = useState<PresenceIdentity | null>(null);

  useEffect(() => {
    setIdentity(getOrCreatePresenceIdentity());
  }, []);

  if (!identity) {
    return <>{children}</>;
  }

  return (
    <PresenceRoomConnected sessionRoom={sessionRoom} identity={identity}>
      {children}
    </PresenceRoomConnected>
  );
}

function PresenceRoomConnected({
  sessionRoom,
  identity,
  children,
}: {
  sessionRoom: string | null;
  identity: PresenceIdentity;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams?.toString() ?? '';
  const enabled = Boolean(sessionRoom);
  const presenceRoute = useMemo(
    () => (sessionRoom ? scopedPresenceRoom(sessionRoom, pathname) : ''),
    [sessionRoom, pathname],
  );
  const relayUrl = useMemo(() => resolvePresenceRelayUrl(), []);

  const { room, presence, others, pushPresence, setCardFocus, setCellFocus } = useJoinedPresenceRoom({
    peerId: identity.peerId,
    roomName: presenceRoute,
    relayUrl,
    enabled,
    initial: { name: identity.name, color: identity.color },
  });

  const navRoomName = sessionRoom ? navPresenceRoom(sessionRoom) : '';
  const {
    presence: navPresence,
    pushPresence: pushNavPresence,
  } = useJoinedPresenceRoom({
    peerId: identity.peerId,
    roomName: navRoomName,
    relayUrl,
    enabled: enabled && Boolean(navRoomName),
    initial: { name: identity.name, color: identity.color },
  });

  const navRoute = useMemo(
    () => presenceRouteKey(searchKey ? `${pathname}?${searchKey}` : pathname),
    [pathname, searchKey],
  );

  useEffect(() => {
    if (!enabled || !navRoomName) return;
    pushNavPresence({ route: navRoute });
  }, [enabled, navRoomName, navRoute, pushNavPresence]);

  useTabVisibilityPresence(pushNavPresence, enabled && Boolean(navRoomName));

  const navPeers = useMemo(
    () => navPresence.filter((peer) => !peer.self),
    [navPresence],
  );

  const { selfCursor } = usePointerPresence(pushPresence);

  usePresencePeerToasts(others, presenceRoute, enabled);

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

  const focusByCell = useMemo(() => buildFocusByCell(presence), [presence]);

  const value = useMemo<PresenceContextValue>(
    () => ({
      enabled,
      sessionRoom: sessionRoom ?? '',
      presenceRoute,
      room,
      presence,
      others,
      identity,
      selfCursor,
      setCardFocus,
      setCellFocus,
      focusByCardId,
      focusByCell,
      navPeers,
      sessionPresence: navPresence,
    }),
    [
      enabled,
      sessionRoom,
      presenceRoute,
      room,
      presence,
      others,
      identity,
      selfCursor,
      setCardFocus,
      setCellFocus,
      focusByCardId,
      focusByCell,
      navPeers,
      navPresence,
    ],
  );

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

export function PresenceRoom({ children }: { children: ReactNode }) {
  const sessionRoom = useSessionRoom();

  return <PresenceRoomActive sessionRoom={sessionRoom}>{children}</PresenceRoomActive>;
}
