'use client';

import { useEffect } from 'react';
import { useTrellis } from 'trellis/react';
import { useEntities, useMutation } from 'trellis/react/typed';
import type { AnyType, InferType } from 'trellis/schema';

/**
 * Sole graph ingress for a board (per fractal-projection-contract.md).
 *
 * `useEntities` is realtime + hydrated (trellis/react/typed wraps `liveEntities`,
 * which subscribes via WS and resolves full entities) — the React analog of the
 * Svelte `connectProjection` + `entitiesStore` + `hydrateEntityRows` pipeline.
 */
export function useCollection<S extends AnyType>(schema: S) {
  const client = useTrellis();

  useEffect(() => {
    void client.registerType(schema).catch((err: unknown) => {
      console.error('[useCollection] registerType failed', err);
    });
  }, [client, schema]);

  const { data, loading, error } = useEntities(schema);
  const mut = useMutation(schema);

  return {
    rows: data as InferType<S>[],
    mut,
    loading,
    error,
  };
}
