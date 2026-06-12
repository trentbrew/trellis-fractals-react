'use client';

import { useEffect } from 'react';
import { useTrellis } from 'trellis/react';
import { bootstrapExplorerSchemas } from '@/lib/trellis/bootstrap-schemas';

/** Register explorer schemas once per tab (idempotent). */
export function BootstrapSchemas({ children }: { children: React.ReactNode }) {
  const client = useTrellis();

  useEffect(() => {
    void bootstrapExplorerSchemas(client).catch((err: unknown) => {
      console.error('[BootstrapSchemas] failed', err);
    });
  }, [client]);

  return children;
}
