'use client';

import { useLayoutEffect, type ReactNode } from 'react';
import { TrellisProvider as BaseTrellisProvider, useTrellis } from 'trellis/react';
import { FetchError } from 'trellis/client/sdk';

/** Direct origin for WebSocket realtime (cross-origin WS is fine in browsers). */
const TRELLIS_ORIGIN =
  process.env.NEXT_PUBLIC_TRELLIS_URL ?? 'http://localhost:8230';

/** Same-origin HTTP proxy — see `rewrites` in next.config.ts. */
const TRELLIS_HTTP_PROXY = '/api/trellis';

type FetchableTrellisDb = {
  opts: { apiKey?: string };
  _fetch: (
    method: string,
    path: string,
    body?: unknown,
  ) => Promise<unknown>;
};

function installHttpProxy(db: FetchableTrellisDb) {
  db._fetch = async (
    method: string,
    path: string,
    body?: unknown,
  ) => {
    const res = await fetch(`${TRELLIS_HTTP_PROXY}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(db.opts.apiKey
          ? { Authorization: `Bearer ${db.opts.apiKey}` }
          : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new FetchError(
        res.status,
        (data as { message?: string })?.message ?? res.statusText,
        data,
      );
    }
    return data;
  };
}

/**
 * Trellis server does not emit CORS headers. Patch the SDK client's HTTP layer
 * to route through the Next.js rewrite while leaving WebSocket on TRELLIS_ORIGIN.
 */
function TrellisHttpProxy({ children }: { children: ReactNode }) {
  const client = useTrellis();

  // Parent layout effect runs before child useEffects (registerType, liveEntities).
  useLayoutEffect(() => {
    installHttpProxy(client as unknown as FetchableTrellisDb);
  }, [client]);

  return children;
}

/**
 * Root Trellis client — one shared TrellisDb for the whole tab (App Router
 * layouts persist across client-side navigation).
 */
export function TrellisProvider({ children }: { children: ReactNode }) {
  return (
    <BaseTrellisProvider url={TRELLIS_ORIGIN}>
      <TrellisHttpProxy>{children}</TrellisHttpProxy>
    </BaseTrellisProvider>
  );
}
