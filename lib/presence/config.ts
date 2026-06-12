function isLocalHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

/**
 * Relay base URL for cross-browser presence.
 * - localhost → undefined (BroadcastChannel, cross-tab, no server)
 * - hosted → `wss://{TRELLIS_URL}/rt` unless overridden
 */
export function resolvePresenceRelayUrl(): string | undefined {
  if (isLocalHost()) {
    const explicit = process.env.NEXT_PUBLIC_PRESENCE_RELAY_URL?.trim();
    return explicit ? explicit.replace(/\/$/, '') : undefined;
  }

  const explicit = process.env.NEXT_PUBLIC_PRESENCE_RELAY_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  const trellis = process.env.NEXT_PUBLIC_TRELLIS_URL?.trim();
  if (!trellis) return undefined;

  return `${trellis.replace(/^http/i, 'ws').replace(/\/$/, '')}/rt`;
}

export function presenceRoomId(scope: string, sessionRoom: string): string {
  return `${scope}:${sessionRoom}`;
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
