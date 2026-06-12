'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const ROOM_STORAGE_KEY = 'trellis-playground-room';

function isLocalHost(): boolean {
  if (typeof window === 'undefined') return true;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

/** Optional `?room=my-demo` — same slug → same graph (shareable across browsers). */
export function getRoomIdFromUrl(search = ''): string | null {
  if (typeof window === 'undefined' && !search) return null;
  const raw = search || window.location.search;
  const room = new URLSearchParams(raw.startsWith('?') ? raw.slice(1) : raw).get('room');
  if (!room) return null;
  const slug = room.trim();
  if (!slug || slug.length > 64 || !/^[a-zA-Z0-9_-]+$/.test(slug)) return null;
  return slug;
}

/**
 * Mint or reuse a session room id.
 * - `?room=slug` → explicit shared room (URL-shareable, persisted to localStorage)
 * - else localStorage → shared across tabs on this origin
 * - localhost fallback → `lobby` (dev default, matches realtime-app demo)
 * - hosted fallback → random uuid (isolated tenant per browser)
 */
export function getOrCreateSessionRoomId(search = ''): string {
  const fromUrl = getRoomIdFromUrl(search);
  if (fromUrl) {
    localStorage.setItem(ROOM_STORAGE_KEY, fromUrl);
    return fromUrl;
  }

  let id = localStorage.getItem(ROOM_STORAGE_KEY);
  if (!id) {
    id = sessionStorage.getItem(ROOM_STORAGE_KEY);
  }
  if (!id) {
    id = isLocalHost() ? 'lobby' : crypto.randomUUID();
  }
  localStorage.setItem(ROOM_STORAGE_KEY, id);
  return id;
}

/**
 * Resolve the active room and mirror it into the URL when missing so every tab
 * targets the same shareable slug (matches trellis realtime-app `?room=` UX).
 */
export function resolveAndSyncSessionRoom(search = ''): string {
  const room = getOrCreateSessionRoomId(search);

  if (typeof window !== 'undefined' && !getRoomIdFromUrl(search)) {
    const url = new URL(window.location.href);
    url.searchParams.set('room', room);
    window.history.replaceState(null, '', `${url.pathname}${url.search}`);
  }

  return room;
}

/**
 * Hosted writable app → isolated tenant per session room.
 * Readonly embed + local dev → default showcase tenant (shared seed).
 */
export function resolvePlaygroundTenantId(readonly: boolean, search = ''): string | undefined {
  if (typeof window === 'undefined') return undefined;
  if (isLocalHost()) return undefined;
  if (readonly) return undefined;
  return `embed-${getOrCreateSessionRoomId(search)}`;
}

/**
 * Resolve tenant after mount so SSR and the first client paint agree (undefined).
 */
export function usePlaygroundTenantId(readonly: boolean): {
  tenantId: string | undefined;
  ready: boolean;
} {
  const searchParams = useSearchParams();
  const roomKey = searchParams.get('room') ?? '';
  const [state, setState] = useState<{
    tenantId: string | undefined;
    ready: boolean;
  }>({ tenantId: undefined, ready: false });

  useEffect(() => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    resolveAndSyncSessionRoom(search);
    setState({
      tenantId: resolvePlaygroundTenantId(readonly, search),
      ready: true,
    });
  }, [readonly, roomKey]);

  return state;
}

/**
 * Presence + graph room slug — reactive across tabs via storage events.
 */
export function useSessionRoom(): string | null {
  const searchParams = useSearchParams();
  const roomKey = searchParams.get('room') ?? '';
  const [sessionRoom, setSessionRoom] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      const search = window.location.search;
      setSessionRoom(resolveAndSyncSessionRoom(search));
    };

    sync();

    const onStorage = (event: StorageEvent) => {
      if (event.key === ROOM_STORAGE_KEY && event.newValue) {
        const url = new URL(window.location.href);
        url.searchParams.set('room', event.newValue);
        window.history.replaceState(null, '', `${url.pathname}${url.search}`);
        setSessionRoom(event.newValue);
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [roomKey]);

  return sessionRoom;
}
