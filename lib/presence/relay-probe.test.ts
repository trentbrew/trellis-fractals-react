import { afterEach, describe, expect, it, vi } from 'vitest';
import { relayHealthCheckUrl } from './config';
import { resetPresenceRelayProbeCache, resolveRelayForJoin } from './relay-probe';

describe('relayHealthCheckUrl', () => {
  it('maps ws relay base to http health endpoint', () => {
    expect(relayHealthCheckUrl('ws://localhost:8231/rt')).toBe('http://localhost:8231/health');
  });
});

describe('resolveRelayForJoin', () => {
  afterEach(() => {
    resetPresenceRelayProbeCache();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns configured relay on non-localhost without probing', async () => {
    vi.stubGlobal('window', { location: { hostname: 'playground.example.com' } });
    const WebSocketMock = vi.fn();
    vi.stubGlobal('WebSocket', WebSocketMock);

    await expect(resolveRelayForJoin('wss://playground.example.com/rt')).resolves.toBe(
      'wss://playground.example.com/rt',
    );
    expect(WebSocketMock).not.toHaveBeenCalled();
  });

  it('falls back when localhost relay WebSocket probe fails', async () => {
    vi.stubGlobal('window', { location: { hostname: 'localhost' } });
    vi.stubGlobal(
      'WebSocket',
      vi.fn().mockImplementation(() => {
        const listeners = new Map<string, () => void>();
        return {
          addEventListener: (event: string, cb: () => void) => listeners.set(event, cb),
          close: vi.fn(),
          dispatchError: () => listeners.get('error')?.(),
        };
      }),
    );

    const pending = resolveRelayForJoin('ws://localhost:8231/rt');
    await vi.waitFor(() => {
      expect(WebSocket).toHaveBeenCalledTimes(1);
    });
    (WebSocket as unknown as ReturnType<typeof vi.fn>).mock.results[0]?.value.dispatchError();
    await expect(pending).resolves.toBeUndefined();
    await expect(resolveRelayForJoin('ws://localhost:8231/rt')).resolves.toBeUndefined();
    expect(WebSocket).toHaveBeenCalledTimes(1);
  });

  it('uses relay when localhost WebSocket probe succeeds', async () => {
    vi.stubGlobal('window', { location: { hostname: 'localhost' } });
    vi.stubGlobal(
      'WebSocket',
      vi.fn().mockImplementation(() => {
        const listeners = new Map<string, () => void>();
        queueMicrotask(() => listeners.get('open')?.());
        return {
          addEventListener: (event: string, cb: () => void) => listeners.set(event, cb),
          close: vi.fn(),
        };
      }),
    );

    await expect(resolveRelayForJoin('ws://localhost:8231/rt')).resolves.toBe(
      'ws://localhost:8231/rt',
    );
  });
});
