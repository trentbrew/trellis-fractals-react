/** shadcn CSS variables applied by the color theme picker (tweakcn-compatible).
 *  Shell surfaces (`shell-rail`, `shell-panel`) derive from `--sidebar` unless overridden.
 *  Border variants (`border-subtle`, `border`, `border-strong`) derive from raw `--border`. */

export type ThemeTokens = Partial<Record<string, string>>;

export type ColorThemePreset = {
  id: string;
  label: string;
  /** Primary swatch for the picker UI */
  swatch: string;
  light: ThemeTokens;
  dark: ThemeTokens;
};

export const NEUTRAL_THEME_ID = 'neutral';
export const DEFAULT_THEME_ID = 'notebook';

export const tokens = (
  light: ThemeTokens,
  dark: ThemeTokens,
): Pick<ColorThemePreset, 'light' | 'dark'> => ({ light, dark });
