'use client';

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  applyColorTheme,
  readStoredColorThemeId,
} from '@/lib/color-theme';
import { useTheme } from '@/lib/shell/theme';
import { COLOR_THEME_PRESETS, type ColorThemePreset } from '@/lib/theme-presets';

type ColorThemeContextValue = {
  presetId: string;
  setPresetId: (id: string) => void;
  presets: ColorThemePreset[];
};

const ColorThemeContext = createContext<ColorThemeContextValue | null>(null);

export function ColorThemeProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const [presetId, setPresetIdState] = useState(readStoredColorThemeId);

  const setPresetId = useCallback(
    (id: string) => {
      setPresetIdState(id);
      applyColorTheme(id, theme === 'dark' ? 'dark' : 'light');
    },
    [theme],
  );

  useLayoutEffect(() => {
    applyColorTheme(presetId, theme === 'dark' ? 'dark' : 'light');
  }, [presetId, theme]);

  const value = useMemo(
    () => ({ presetId, setPresetId, presets: COLOR_THEME_PRESETS }),
    [presetId, setPresetId],
  );

  return (
    <ColorThemeContext.Provider value={value}>{children}</ColorThemeContext.Provider>
  );
}

export function useColorTheme() {
  const context = useContext(ColorThemeContext);
  if (!context) {
    throw new Error('useColorTheme must be used within ColorThemeProvider');
  }
  return context;
}
