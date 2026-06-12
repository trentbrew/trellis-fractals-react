'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  DEFAULT_VANTAGE_MOTION,
  isVantageMotion,
  VANTAGE_MOTION_STORAGE_KEY,
  type VantageMotion,
} from '@/lib/fractal/vantage-motion-types';

type VantageMotionContextValue = {
  motion: VantageMotion;
  setMotion: (motion: VantageMotion) => void;
};

const VantageMotionContext = createContext<VantageMotionContextValue | null>(null);

function readStoredMotion(): VantageMotion | null {
  try {
    const stored = localStorage.getItem(VANTAGE_MOTION_STORAGE_KEY);
    if (isVantageMotion(stored)) return stored;
  } catch {
    /* ignore */
  }
  return null;
}

function systemMotion(): VantageMotion {
  if (typeof window === 'undefined') return DEFAULT_VANTAGE_MOTION;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'reduced'
    : DEFAULT_VANTAGE_MOTION;
}

function persistMotion(motion: VantageMotion) {
  try {
    localStorage.setItem(VANTAGE_MOTION_STORAGE_KEY, motion);
  } catch {
    /* ignore */
  }
}

export function VantageMotionProvider({ children }: { children: React.ReactNode }) {
  const [motion, setMotionState] = useState<VantageMotion>(DEFAULT_VANTAGE_MOTION);

  useEffect(() => {
    setMotionState(readStoredMotion() ?? systemMotion());
  }, []);

  const setMotion = useCallback((next: VantageMotion) => {
    setMotionState(next);
    persistMotion(next);
  }, []);

  const value = useMemo(() => ({ motion, setMotion }), [motion, setMotion]);

  return (
    <VantageMotionContext.Provider value={value}>{children}</VantageMotionContext.Provider>
  );
}

export function useVantageMotion() {
  const context = useContext(VantageMotionContext);
  if (!context) {
    throw new Error('useVantageMotion must be used within VantageMotionProvider');
  }
  return context;
}
