'use client';

import { useLayoutEffect, type ReactNode } from 'react';
import { TrellisProvider as BaseTrellisProvider, useTrellis } from 'trellis/react';
import { FetchError } from 'trellis/client/sdk';
import { usePlaygroundTenantId } from '@/lib/shell/session-room';
import { useEmbedFlags } from '@/lib/shell/use-embed-flags';
import {
  installRealtimeAuth,
  installTenantTransport,
} from '@/lib/trellis/tenant-transport';

/** Direct origin for WebSocket realtime (cross-origin WS is fine in browsers). */
const TRELLIS_ORIGIN =
  process.env.NEXT_PUBLIC_TRELLIS_URL ?? 'http://localhost:8230';

const TRELLIS_API_KEY = process.env.NEXT_PUBLIC_TRELLIS_API_KEY?.trim();

/** Local dev uses same-origin proxy; hosted uses direct CORS to the room node (Vercel rewrites cannot reach *.sprites.app). */
const USE_HTTP_PROXY =
  !process.env.NEXT_PUBLIC_TRELLIS_URL ||
  process.env.NEXT_PUBLIC_TRELLIS_URL.includes('localhost');

/** Same-origin HTTP proxy — see `rewrites` in next.config.ts (local dev only). */
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

function TrellisTransport({
  children,
  tenantId,
  ready,
}: {
  children: ReactNode;
  tenantId: string | undefined;
  ready: boolean;
}) {
  const client = useTrellis();

  useLayoutEffect(() => {
    if (!ready) return;
    if (USE_HTTP_PROXY) {
      installHttpProxy(client as unknown as FetchableTrellisDb);
    }
    if (tenantId) {
      installTenantTransport(client, tenantId, TRELLIS_API_KEY);
      return;
    }
    installRealtimeAuth(client, TRELLIS_API_KEY);
  }, [client, tenantId, ready]);

  return children;
}

/**
 * Root Trellis client — one shared TrellisDb for the whole tab (App Router
 * layouts persist across client-side navigation).
 */
export function TrellisProvider({ children }: { children: ReactNode }) {
  const { readonly } = useEmbedFlags();
  const { tenantId, ready } = usePlaygroundTenantId(readonly);

  if (!ready) {
    return null;
  }

  return (
    <BaseTrellisProvider url={TRELLIS_ORIGIN} apiKey={TRELLIS_API_KEY} tenantId={tenantId}>
      <TrellisTransport tenantId={tenantId} ready={ready}>
        {children}
      </TrellisTransport>
    </BaseTrellisProvider>
  );
}
