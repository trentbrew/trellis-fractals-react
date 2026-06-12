'use client';

import { useEffect } from 'react';
import { useTrellis } from 'trellis/react';
import { useEntities, useMutation } from 'trellis/react/typed';
import type { AnyType, InferType, WhereInput } from 'trellis/schema';

export type CollectionQueryOpts = {
  where?: WhereInput;
};

/**
 * Sole graph ingress for a board (per fractal-projection-contract.md).
 */
export function useCollection<S extends AnyType>(
  schema: S,
  opts?: CollectionQueryOpts,
) {
  const client = useTrellis();

  useEffect(() => {
    void client.registerType(schema).catch((err: unknown) => {
      console.error('[useCollection] registerType failed', err);
    });
  }, [client, schema]);

  const entityOpts = opts?.where ? { where: opts.where } : undefined;
  const { data, loading, error } = useEntities(schema, entityOpts);
  const mut = useMutation(schema);

  return {
    rows: data as InferType<S>[],
    mut,
    loading,
    error,
  };
}
