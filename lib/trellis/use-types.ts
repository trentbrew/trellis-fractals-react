'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FormLayout, FormShellKind } from '@/lib/forms/record-form-layout';
import type { TypeField } from '@/lib/schemas/record-fields';

export type TypeDef = {
  '@id': string;
  label?: string;
  icon?: string;
  color?: string;
  fields?: TypeField[];
  /** Preferred form shell for create/edit (kernel `dialogShell` parity). */
  dialogShell?: FormShellKind;
  formLayout?: FormLayout;
};

export type TypeUpdate = Partial<
  Pick<TypeDef, 'label' | 'fields' | 'icon' | 'color' | 'dialogShell' | 'formLayout'>
> & {
  dialogShell?: FormShellKind | null;
  formLayout?: FormLayout | null;
};

const TRELLIS_HTTP_PROXY = '/api/trellis';

let typesCache: TypeDef[] | null = null;
let typesFetch: Promise<TypeDef[]> | null = null;
const typeListeners = new Set<(list: TypeDef[]) => void>();

function publishTypes(list: TypeDef[]) {
  typesCache = list;
  for (const listener of typeListeners) {
    listener(list);
  }
}

async function fetchTypes(force = false): Promise<TypeDef[]> {
  if (!force && typesCache) return typesCache;
  if (!force && typesFetch) return typesFetch;

  typesFetch = (async () => {
    const res = await fetch(`${TRELLIS_HTTP_PROXY}/ontologies`);
    if (res.status === 404) {
      typesCache = [];
      return [];
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as TypeDef[] | { data?: TypeDef[] };
    const list = Array.isArray(data) ? data : (data.data ?? []);
    publishTypes(list);
    return list;
  })();

  try {
    return await typesFetch;
  } finally {
    typesFetch = null;
  }
}

export function useTypes() {
  const [types, setTypes] = useState<TypeDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async (force = false) => {
    try {
      setLoading(true);
      const list = await fetchTypes(force);
      setTypes(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const sync = (list: TypeDef[]) => setTypes(list);
    typeListeners.add(sync);
    if (typesCache) setTypes(typesCache);
    return () => {
      typeListeners.delete(sync);
    };
  }, []);

  useEffect(() => {
    // Initial client hydration fetch; `refresh` owns loading/error state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const createType = useCallback(
    async (def: TypeDef) => {
      const res = await fetch(`${TRELLIS_HTTP_PROXY}/ontologies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          '@id': def['@id'],
          '@type': 'trellis:Schema',
          version: '1.0.0',
          tier: 'user',
          subClassOf: 'core:Record',
          label: def.label,
          fields: def.fields ?? [],
          ...(def.icon !== undefined ? { icon: def.icon } : {}),
          ...(def.color !== undefined ? { color: def.color } : {}),
          ...(def.dialogShell ? { dialogShell: def.dialogShell } : {}),
          ...(def.formLayout ? { formLayout: def.formLayout } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message ?? res.statusText);
      }
      typesCache = null;
      await refresh(true);
    },
    [refresh],
  );

  const updateType = useCallback(
    async (id: string, updates: TypeUpdate) => {
      const res = await fetch(
        `${TRELLIS_HTTP_PROXY}/ontologies/${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message ?? res.statusText);
      }
      const updated = (await res.json()) as TypeDef;
      const base = typesCache ?? [];
      const next = base.some((entry) => entry['@id'] === id)
        ? base.map((entry) => (entry['@id'] === id ? updated : entry))
        : [...base, updated];
      publishTypes(next);
      setError(null);
    },
    [],
  );

  return { types, loading, error, refresh, createType, updateType };
}
