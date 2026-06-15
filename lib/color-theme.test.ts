import { describe, expect, it } from 'vitest';

import {
  COLOR_THEME_STORAGE_KEY,
  DEFAULT_THEME_ID,
  getColorThemePreset,
  readStoredColorThemeId,
} from '@/lib/color-theme';
import { NEUTRAL_THEME_ID } from '@/lib/theme-presets';

describe('color-theme defaults', () => {
  it('falls back to notebook preset', () => {
    expect(getColorThemePreset('missing-id').id).toBe(DEFAULT_THEME_ID);
    expect(DEFAULT_THEME_ID).toBe('notebook');
  });

  it('returns notebook when storage is empty or unavailable', () => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      expect(readStoredColorThemeId()).toBe('notebook');
      return;
    }

    const previous = localStorage.getItem(COLOR_THEME_STORAGE_KEY);
    try {
      localStorage.removeItem(COLOR_THEME_STORAGE_KEY);
      expect(readStoredColorThemeId()).toBe('notebook');
    } finally {
      if (previous == null) localStorage.removeItem(COLOR_THEME_STORAGE_KEY);
      else localStorage.setItem(COLOR_THEME_STORAGE_KEY, previous);
    }
  });

  it('keeps neutral playground preset available', () => {
    expect(getColorThemePreset(NEUTRAL_THEME_ID).id).toBe('neutral');
  });
});
