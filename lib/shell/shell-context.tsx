'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import type { CollectionViewMode } from '@/lib/registry/collection-views';
import { COLLECTIONS_RESERVED_SLUGS } from '@/lib/registry/type-utils';
import { shellModeFromPath, type ShellMode } from './modes';

type ShellContextValue = {
  mode: ShellMode;
  collectionSlug: string | null;
  getSessionViewForSlug: (slug: string) => CollectionViewMode | undefined;
  setSessionViewForSlug: (slug: string, mode: CollectionViewMode) => void;
  clearSessionViewForSlug: (slug: string) => void;
};

const ShellContext = createContext<ShellContextValue | null>(null);

export function ShellProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const mode = shellModeFromPath(pathname);

  const collectionSlug = useMemo(() => {
    const match = pathname.match(/^\/collections\/([^/]+)/);
    const slug = match?.[1] ?? null;
    if (!slug || COLLECTIONS_RESERVED_SLUGS.has(slug)) return null;
    return slug;
  }, [pathname]);

  const [sessionViewBySlug, setSessionViewBySlug] = useState<
    Record<string, CollectionViewMode>
  >({});

  const getSessionViewForSlug = useCallback(
    (slug: string) => sessionViewBySlug[slug],
    [sessionViewBySlug],
  );

  const setSessionViewForSlug = useCallback((slug: string, mode: CollectionViewMode) => {
    setSessionViewBySlug((prev) => ({ ...prev, [slug]: mode }));
  }, []);

  const clearSessionViewForSlug = useCallback((slug: string) => {
    setSessionViewBySlug((prev) => {
      if (!(slug in prev)) return prev;
      const next = { ...prev };
      delete next[slug];
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      mode,
      collectionSlug,
      getSessionViewForSlug,
      setSessionViewForSlug,
      clearSessionViewForSlug,
    }),
    [
      mode,
      collectionSlug,
      getSessionViewForSlug,
      setSessionViewForSlug,
      clearSessionViewForSlug,
    ],
  );

  return (
    <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
  );
}

export function useShell(): ShellContextValue {
  const ctx = useContext(ShellContext);
  if (!ctx) {
    throw new Error('useShell() must be used within <ShellProvider>.');
  }
  return ctx;
}
