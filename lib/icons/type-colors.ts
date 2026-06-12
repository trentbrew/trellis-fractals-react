'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'playground:type-colors';

export const TYPE_COLOR_PRESETS = [
  '#0f62fe',
  '#24a148',
  '#fa4d56',
  '#f1c21b',
  '#8a3ffc',
  '#007d79',
  '#ff832b',
  '#525252',
] as const;

export type TypeColorMap = Record<string, string>;

function readTypeColors(): TypeColorMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as TypeColorMap;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeTypeColors(map: TypeColorMap) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

/** Legacy local fallback when type PATCH for `color` is unavailable. */
export function useTypeColors() {
  const [colors, setColors] = useState<TypeColorMap>({});

  useEffect(() => {
    setColors(readTypeColors());
  }, []);

  const setTypeColor = useCallback((typeId: string, color: string) => {
    setColors((prev) => {
      const next = { ...prev, [typeId]: color };
      writeTypeColors(next);
      return next;
    });
  }, []);

  const getTypeColor = useCallback(
    (typeId: string, fallbackIndex = 0) =>
      colors[typeId] ?? TYPE_COLOR_PRESETS[fallbackIndex % TYPE_COLOR_PRESETS.length],
    [colors],
  );

  return { colors, getTypeColor, setTypeColor };
}
