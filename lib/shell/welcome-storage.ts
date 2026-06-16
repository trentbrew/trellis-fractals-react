const WELCOME_STORAGE_KEY = 'fractals-welcome-dismissed-v1';

export function isWelcomeDismissed(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(WELCOME_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissWelcome(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(WELCOME_STORAGE_KEY, '1');
  } catch {
    // ignore
  }
}
