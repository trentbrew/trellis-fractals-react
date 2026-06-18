import { describe, expect, it } from 'vitest';

import {
  COLOR_THEME_STORAGE_KEY,
  getColorThemePreset,
  readStoredColorThemeId,
} from '@/lib/color-theme';
import { DEFAULT_THEME_ID, NEUTRAL_THEME_ID, COLOR_THEME_PRESETS } from '@/lib/theme-presets';

describe('color-theme defaults', () => {
  it('falls back to notebook preset', () => {
    expect(getColorThemePreset('missing-id').id).toBe(DEFAULT_THEME_ID);
    expect(DEFAULT_THEME_ID).toBe('notebook');
  });

  it('returns notebook when storage is empty or unavailable', () => {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
      expect(readStoredColorThemeId()).toBe('notebook');
      return;
    }

    const previous = sessionStorage.getItem(COLOR_THEME_STORAGE_KEY);
    try {
      sessionStorage.removeItem(COLOR_THEME_STORAGE_KEY);
      expect(readStoredColorThemeId()).toBe('notebook');
    } finally {
      if (previous == null) sessionStorage.removeItem(COLOR_THEME_STORAGE_KEY);
      else sessionStorage.setItem(COLOR_THEME_STORAGE_KEY, previous);
    }
  });

  it('keeps neutral playground preset available', () => {
    expect(getColorThemePreset(NEUTRAL_THEME_ID).id).toBe('neutral');
  });

  it('exposes unique tweakcn preset ids', () => {
    const ids = COLOR_THEME_PRESETS.map((preset) => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(20);
  });
});
