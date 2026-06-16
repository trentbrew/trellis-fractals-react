function isLocalHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

/**
 * Relay base URL for cross-browser presence (optional accelerator).
 *
 * - localhost + `NEXT_PUBLIC_PRESENCE_RELAY_URL` → probed at join; falls back to
 *   BroadcastChannel when the relay is down (see {@link resolveRelayForJoin})
 * - localhost without explicit relay → BroadcastChannel only
 * - hosted → `wss://{NEXT_PUBLIC_TRELLIS_URL}/rt` when set
 */
export function resolvePresenceRelayUrl(): string | undefined {
  const explicit = process.env.NEXT_PUBLIC_PRESENCE_RELAY_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  if (isLocalHost()) return undefined;

  const trellis = process.env.NEXT_PUBLIC_TRELLIS_URL?.trim();
  if (!trellis) return undefined;

  return `${trellis.replace(/^http/i, 'ws').replace(/\/$/, '')}/rt`;
}

/** HTTP health URL for a relay base (`ws://host:port/rt` → `http://host:port/health`). */
export function relayHealthCheckUrl(relayUrl: string): string {
  const parsed = new URL(relayUrl.replace(/^ws/i, 'http'));
  return `${parsed.protocol}//${parsed.host}/health`;
}

/**
 * Normalize an App Router route (pathname, optionally with a `?query`) for
 * presence scoping and nav-link matching. Query params are sorted so equivalent
 * URLs compare equal; pathname-only input is unchanged (trailing slash stripped),
 * so cursor-room scoping stays page-level.
 */
export function presenceRouteKey(route: string): string {
  const [rawPath, rawQuery = ''] = route.split('?');
  const path = rawPath.replace(/\/+$/, '') || '/';
  if (!rawQuery) return path;
  const params = new URLSearchParams(rawQuery);
  params.sort();
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function presenceRoomId(scope: string, sessionRoom: string): string {
  return `${scope}:${sessionRoom}`;
}

/** Presence room scoped to a single page — peers on other routes do not see cursors. */
export function scopedPresenceRoom(sessionRoom: string, pathname: string): string {
  return presenceRoomId(presenceRouteKey(pathname), sessionRoom);
}

/** Session-wide lobby — peers broadcast route for icon-rail badges only. */
export function navPresenceRoom(sessionRoom: string): string {
  return presenceRoomId('__nav__', sessionRoom);
}

/** Pointer event → normalized coordinates over an element. */
export function normalizePointer(
  event: { clientX: number; clientY: number; currentTarget: EventTarget | null },
): { x: number; y: number } {
  const el = event.currentTarget as HTMLElement;
  const rect = el.getBoundingClientRect();
  const clamp = (value: number) => Math.min(1, Math.max(0, value));
  return {
    x: clamp((event.clientX - rect.left) / rect.width),
    y: clamp((event.clientY - rect.top) / rect.height),
  };
}
