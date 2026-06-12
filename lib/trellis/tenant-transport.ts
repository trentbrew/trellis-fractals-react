import type { TrellisDb } from 'trellis/client/sdk';
import type { SubscribeOptions, Subscription, SubscriptionCallback } from 'trellis/client/sdk';

function appendTenantQuery(path: string, tenantId: string): string {
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}tenantId=${encodeURIComponent(tenantId)}`;
}

type SubRecord = {
  eql: string;
  opts?: SubscribeOptions;
};

type PatchedDb = {
  opts: { url: string; apiKey?: string };
  _fetch: (method: string, path: string, body?: unknown) => Promise<unknown>;
  _subCallbacks: Map<string, SubscriptionCallback<unknown>>;
  _subQueries: Map<string, SubRecord>;
  _ws: WebSocket | null;
  _wsPromise: Promise<WebSocket> | null;
  _ensureWs: () => Promise<WebSocket>;
  _remoteTransportInstalled?: boolean;
  subscribe: <T>(
    eql: string,
    callback: SubscriptionCallback<T>,
    opts?: SubscribeOptions,
  ) => Subscription<T>;
};

function realtimeUrl(origin: string, apiKey?: string): string {
  const wsOrigin = origin.replace(/^https?/, origin.startsWith('https') ? 'wss' : 'ws');
  const base = `${wsOrigin}/realtime`;
  if (!apiKey) return base;
  return `${base}?apiKey=${encodeURIComponent(apiKey)}`;
}

function sendSubscribe(
  ws: WebSocket,
  subId: string,
  record: SubRecord,
  tenantId?: string,
): void {
  ws.send(
    JSON.stringify({
      type: 'subscribe',
      id: subId,
      query: record.eql,
      ...(tenantId ? { tenantId } : {}),
      ...(record.opts?.entityType ? { entityType: record.opts.entityType } : {}),
      ...(record.opts?.resolve ? { resolve: record.opts.resolve } : {}),
    }),
  );
}

function resendSubscriptions(internal: PatchedDb, tenantId?: string): void {
  const ws = internal._ws;
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  for (const [subId, record] of internal._subQueries) {
    if (internal._subCallbacks.has(subId)) {
      sendSubscribe(ws, subId, record, tenantId);
    }
  }
}

function installRealtimeSocket(internal: PatchedDb, apiKey?: string, tenantId?: string): void {
  internal._ensureWs = function patchedEnsureWs(this: PatchedDb) {
    if (this._ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve(this._ws);
    }
    if (this._wsPromise) {
      return this._wsPromise;
    }

    const wsUrl = realtimeUrl(this.opts.url, apiKey ?? this.opts.apiKey);
    this._wsPromise = new Promise<WebSocket>((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        this._ws = ws;
        resendSubscriptions(this, tenantId);
        resolve(ws);
      };
      ws.onerror = (event) => {
        reject(event instanceof Error ? event : new Error('WebSocket error'));
      };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(String(event.data)) as {
            type?: string;
            id?: string;
            result?: unknown;
            diff?: unknown;
            resolved?: boolean;
          };
          if (msg.type === 'data' && msg.id && this._subCallbacks.has(msg.id)) {
            const meta = msg.resolved === true ? { resolved: true as const } : undefined;
            const rows = Array.isArray(msg.result) ? msg.result : [];
            const diff =
              msg.diff && typeof msg.diff === 'object'
                ? (msg.diff as { added: unknown[]; updated: unknown[]; removed: unknown[] })
                : { added: [], updated: [], removed: [] };
            this._subCallbacks.get(msg.id)?.(rows, diff, meta);
          }
        } catch {
          /* ignore malformed frames */
        }
      };
      ws.onclose = () => {
        if (this._ws === ws) {
          this._ws = null;
        }
      };
    }).finally(() => {
      this._wsPromise = null;
    });

    return this._wsPromise;
  };
}

/**
 * Remote SDK stores tenantId on opts but browser bundle does not send it yet.
 * Patch HTTP + WS subscribe (and WS auth URL) until trellis@next ships native transport.
 */
export function installTenantTransport(
  db: TrellisDb,
  tenantId: string,
  apiKey?: string,
): void {
  const internal = db as unknown as PatchedDb;
  if (!internal._subQueries) {
    internal._subQueries = new Map();
  }

  if (!internal._remoteTransportInstalled) {
    internal._remoteTransportInstalled = true;
    installRealtimeSocket(internal, apiKey, tenantId);

    const origFetch = internal._fetch.bind(internal);
    internal._fetch = (method, path, body) =>
      origFetch(method, appendTenantQuery(path, tenantId), body);
  }

  internal.subscribe = (eql, callback, opts) => {
    const subId = `sub_${crypto.randomUUID()}`;
    internal._subCallbacks.set(subId, callback as SubscriptionCallback<unknown>);
    internal._subQueries.set(subId, { eql, opts });

    void internal._ensureWs().then((ws) => {
      sendSubscribe(ws, subId, { eql, opts }, tenantId);
    });

    return {
      unsubscribe: () => {
        internal._subCallbacks.delete(subId);
        internal._subQueries.delete(subId);
        internal._ws?.send(JSON.stringify({ type: 'unsubscribe', id: subId }));
      },
    };
  };
}

/** Install WS apiKey auth when there is no per-session tenant (readonly showcase). */
export function installRealtimeAuth(db: TrellisDb, apiKey?: string): void {
  if (!apiKey) return;
  const internal = db as unknown as PatchedDb;
  if (internal._remoteTransportInstalled) return;
  internal._remoteTransportInstalled = true;
  if (!internal._subQueries) {
    internal._subQueries = new Map();
  }
  installRealtimeSocket(internal, apiKey);
}
