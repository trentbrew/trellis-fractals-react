let cached: { relayUrl: string; available: boolean } | null = null;
let loggedFallback = false;

/** Reset probe cache — for tests only. */
export function resetPresenceRelayProbeCache(): void {
  cached = null;
  loggedFallback = false;
}

/**
 * Verify the relay WebSocket endpoint accepts connections.
 * Uses WebSocket (not HTTP /health) so localhost cross-origin probes are not
 * blocked by CORS when the app runs on a different port than the relay.
 */
async function probeRelayHealth(relayUrl: string, timeoutMs = 600): Promise<boolean> {
  if (typeof WebSocket === 'undefined') return false;

  return new Promise((resolve) => {
    let settled = false;
    let ws: WebSocket | undefined;
    const finish = (available: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        ws?.close();
      } catch {
        /* ignore */
      }
      resolve(available);
    };

    const timer = setTimeout(() => finish(false), timeoutMs);
    try {
      ws = new WebSocket(relayUrl);
    } catch {
      finish(false);
      return;
    }

    ws.addEventListener('open', () => finish(true));
    ws.addEventListener('error', () => finish(false));
  });
}

/**
 * On localhost, verify the relay is actually listening before opening WebSockets.
 * When `NEXT_PUBLIC_PRESENCE_RELAY_URL` is set but the relay is down, fall back
 * to BroadcastChannel (same-browser tabs) instead of retrying forever.
 */
export async function resolveRelayForJoin(
  configured: string | undefined,
): Promise<string | undefined> {
  if (!configured) return undefined;

  const isLocalHost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (!isLocalHost) return configured;

  if (cached?.relayUrl === configured) {
    return cached.available ? configured : undefined;
  }

  const available = await probeRelayHealth(configured);
  cached = { relayUrl: configured, available };

  if (!available && !loggedFallback) {
    loggedFallback = true;
    console.info(
      '[trellis presence] Relay unavailable at %s — using BroadcastChannel (same-browser tabs). Run `just presence-relay` for cross-browser.',
      configured,
    );
  }

  return available ? configured : undefined;
}
