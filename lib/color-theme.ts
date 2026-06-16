import {
  COLOR_THEME_PRESETS,
  DEFAULT_THEME_ID,
  NEUTRAL_THEME_ID,
  type ColorThemePreset,
  type ThemeTokens,
} from '@/lib/theme-presets';

/** Per-tab (sessionStorage) — localStorage would sync color theme across peers in other tabs. */
export const COLOR_THEME_STORAGE_KEY = 'fractals-color-theme';

export const SHADCN_THEME_VARS = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'border',
  'input',
  'ring',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'radius',
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
] as const;

/** Optional per-preset overrides; otherwise derived from preset `--border` on apply. */
export const BORDER_THEME_VARS = [
  'border-subtle',
  'border',
  'border-strong',
] as const;

/** Optional per-preset overrides; otherwise derived from `--sidebar` on apply. */
export const SHELL_THEME_VARS = [
  'shell-rail',
  'shell-panel',
  'shell-divider',
] as const;

export const COLOR_THEME_VARS = [
  ...SHADCN_THEME_VARS,
  ...BORDER_THEME_VARS,
  ...SHELL_THEME_VARS,
] as const;

export type ColorThemeMode = 'light' | 'dark';

export function getColorThemePreset(id: string): ColorThemePreset {
  return (
    COLOR_THEME_PRESETS.find((preset) => preset.id === id) ??
    COLOR_THEME_PRESETS.find((preset) => preset.id === DEFAULT_THEME_ID) ??
    COLOR_THEME_PRESETS[0]
  );
}

export function readStoredColorThemeId(): string {
  if (typeof window === 'undefined') return DEFAULT_THEME_ID;
  try {
    const stored = window.sessionStorage.getItem(COLOR_THEME_STORAGE_KEY);
    if (stored && getColorThemePreset(stored).id === stored) return stored;
  } catch {
    // ignore storage failures
  }
  return DEFAULT_THEME_ID;
}

export function persistColorThemeId(id: string) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(COLOR_THEME_STORAGE_KEY, id);
  } catch {
    // ignore storage failures
  }
}

function clearThemeVars(root: HTMLElement) {
  for (const key of COLOR_THEME_VARS) {
    root.style.removeProperty(`--${key}`);
  }
}

function applyTokens(root: HTMLElement, tokens: ThemeTokens) {
  for (const key of COLOR_THEME_VARS) {
    const value = tokens[key];
    if (value) root.style.setProperty(`--${key}`, value);
  }
}

/** Shell inset hierarchy — panel matches sidebar; rail a touch darker. */
const SHELL_SURFACE_DERIVATION: Record<
  ColorThemeMode,
  Pick<ThemeTokens, 'shell-rail' | 'shell-panel' | 'shell-divider'>
> = {
  light: {
    'shell-panel': 'var(--sidebar)',
    'shell-rail': 'color-mix(in oklch, var(--sidebar) 91%, black)',
    'shell-divider': 'var(--border-subtle)',
  },
  dark: {
    'shell-panel': 'var(--sidebar)',
    'shell-rail': 'color-mix(in oklch, var(--sidebar) 88%, black)',
    'shell-divider': 'var(--border-subtle)',
  },
};

/** Border ladder — subtle (shell), default (cards), strong (pickers). */
function applyBorderVariants(
  root: HTMLElement,
  tokens: ThemeTokens = {},
) {
  const computed = getComputedStyle(root);
  const rawBorder = computed.getPropertyValue('--border').trim();
  const background = computed.getPropertyValue('--background').trim();
  const card = computed.getPropertyValue('--card').trim();
  const foreground = computed.getPropertyValue('--foreground').trim();
  const sidebarBorder = computed.getPropertyValue('--sidebar-border').trim();
  const sidebar = computed.getPropertyValue('--sidebar').trim();

  if (rawBorder && !tokens['border-subtle']) {
    root.style.setProperty(
      '--border-subtle',
      `color-mix(in oklch, ${rawBorder} 42%, ${background})`,
    );
  }
  if (rawBorder) {
    root.style.setProperty(
      '--border',
      `color-mix(in oklch, ${rawBorder} 58%, ${card})`,
    );
  }
  if (rawBorder && !tokens['border-strong']) {
    root.style.setProperty(
      '--border-strong',
      `color-mix(in oklch, ${rawBorder} 68%, ${foreground})`,
    );
  }

  if (sidebarBorder && !tokens['sidebar-border']) {
    root.style.setProperty(
      '--sidebar-border',
      `color-mix(in oklch, ${sidebarBorder} 42%, ${sidebar})`,
    );
  }
}

function applyShellSurfaces(
  root: HTMLElement,
  mode: ColorThemeMode,
  tokens: ThemeTokens = {},
) {
  for (const [key, value] of Object.entries(SHELL_SURFACE_DERIVATION[mode])) {
    if (tokens[key] || !value) continue;
    root.style.setProperty(`--${key}`, value);
  }
}

export function applyColorTheme(presetId: string, mode: ColorThemeMode) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const preset = getColorThemePreset(presetId);

  clearThemeVars(root);

  if (preset.id === NEUTRAL_THEME_ID) {
    root.removeAttribute('data-color-theme');
    applyShellSurfaces(root, mode);
    persistColorThemeId(preset.id);
    return;
  }

  root.dataset.colorTheme = preset.id;
  const tokens = mode === 'dark' ? preset.dark : preset.light;
  applyTokens(root, tokens);
  applyBorderVariants(root, tokens);
  applyShellSurfaces(root, mode, tokens);
  persistColorThemeId(preset.id);
}
