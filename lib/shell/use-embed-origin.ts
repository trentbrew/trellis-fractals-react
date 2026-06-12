'use client';

import { useEffect, useState } from 'react';
import {
  PLAYGROUND_PRODUCTION_ORIGIN,
  resolveEmbedOriginFromWindow,
} from '@/lib/shell/embed-origin';

/** Client hook — resolves embed origin after mount (localhost in local dev). */
export function useEmbedOrigin(): string {
  const [origin, setOrigin] = useState(PLAYGROUND_PRODUCTION_ORIGIN);

  useEffect(() => {
    setOrigin(resolveEmbedOriginFromWindow());
  }, []);

  return origin;
}
