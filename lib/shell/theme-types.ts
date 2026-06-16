export type Theme = 'light' | 'dark';

/** Per-tab (sessionStorage) — localStorage would sync theme across peers in other tabs. */
export const THEME_STORAGE_KEY = 'fractals-theme';
