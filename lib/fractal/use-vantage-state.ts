'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_VANTAGE, parseVantageFromSearch } from '@/lib/fractal/vantage';

/** Board-level vantage with optional `?vantage=` seed (embed deep-links). */
export function useVantageState(defaultVantage = DEFAULT_VANTAGE) {
  const [vantage, setVantage] = useState(defaultVantage);

  useEffect(() => {
    const fromUrl = parseVantageFromSearch(window.location.search);
    if (fromUrl !== undefined) setVantage(fromUrl);
  }, []);

  return [vantage, setVantage] as const;
}
