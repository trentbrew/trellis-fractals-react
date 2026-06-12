'use client';

import { useEffect } from 'react';
import { useTrellis } from 'trellis/react';
import { usePlaygroundTenantId } from '@/lib/shell/session-room';
import { useEmbedFlags } from '@/lib/shell/use-embed-flags';
import { seedSessionKanbanIfEmpty } from '@/lib/trellis/seed-session-room';

/** Seed empty per-session tenants on hosted writable app. */
export function SessionRoomBootstrap({ children }: { children: React.ReactNode }) {
  const client = useTrellis();
  const { readonly } = useEmbedFlags();
  const { tenantId, ready } = usePlaygroundTenantId(readonly);

  useEffect(() => {
    if (!ready || !tenantId?.startsWith('embed-')) return;
    void seedSessionKanbanIfEmpty(client).catch((err: unknown) => {
      console.error('[SessionRoomBootstrap] seed failed', err);
    });
  }, [client, tenantId, ready]);

  return children;
}
