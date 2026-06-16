import { afterEach, describe, expect, it, vi } from 'vitest';
import { relayHealthCheckUrl, resolvePresenceRelayUrl, scopedPresenceRoom } from './config';

describe('resolvePresenceRelayUrl', () => {
  // Snapshot a copy (not a reference) so per-test mutations to process.env
  // don't leak into sibling tests via the afterEach restore.
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
    vi.unstubAllGlobals();
  });

  it('uses explicit relay when set', () => {
    process.env.NEXT_PUBLIC_PRESENCE_RELAY_URL = 'ws://localhost:8230/rt/';
    expect(resolvePresenceRelayUrl()).toBe('ws://localhost:8230/rt');
  });

  it('returns undefined on localhost (BroadcastChannel tier)', () => {
    vi.stubGlobal('window', { location: { hostname: 'localhost' } });
    process.env.NEXT_PUBLIC_TRELLIS_URL = 'http://localhost:8230';
    expect(resolvePresenceRelayUrl()).toBeUndefined();
  });

  it('derives wss relay from hosted trellis url', () => {
    process.env.NEXT_PUBLIC_TRELLIS_URL = 'https://playground.trellis.computer';
    expect(resolvePresenceRelayUrl()).toBe('wss://playground.trellis.computer/rt');
  });
});

describe('relayHealthCheckUrl', () => {
  it('derives health endpoint from ws relay base', () => {
    expect(relayHealthCheckUrl('ws://localhost:8231/rt')).toBe('http://localhost:8231/health');
  });
});

describe('scopedPresenceRoom', () => {
  it('scopes presence to pathname + session room', () => {
    expect(scopedPresenceRoom('realtime-app', '/collections/ideas')).toBe(
      '/collections/ideas:realtime-app',
    );
  });
});
