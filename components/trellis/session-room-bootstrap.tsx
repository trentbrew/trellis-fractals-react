'use client';

import { useEffect } from 'react';
import { useTrellis } from 'trellis/react';
import { usePlaygroundTenantId } from '@/lib/shell/session-room';
import { useEmbedFlags } from '@/lib/shell/use-embed-flags';
import { seedPlaygroundDemoIfEmpty } from '@/lib/trellis/seed-playground';

/** Seed empty tenants with demo collections + kanban starter cards. */
export function SessionRoomBootstrap({ children }: { children: React.ReactNode }) {
  const client = useTrellis();
  const { readonly } = useEmbedFlags();
  const { ready } = usePlaygroundTenantId(readonly);

  useEffect(() => {
    if (!ready || readonly) return;
    void seedPlaygroundDemoIfEmpty(client).catch((err: unknown) => {
      console.error('[SessionRoomBootstrap] seed failed', err);
    });
  }, [client, ready, readonly]);

  return children;
}
