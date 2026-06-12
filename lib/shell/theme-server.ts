import { cookies } from 'next/headers';
import { THEME_COOKIE_NAME, type Theme } from '@/lib/shell/theme-types';

export async function getServerTheme(): Promise<Theme> {
  const cookieStore = await cookies();
  const value = cookieStore.get(THEME_COOKIE_NAME)?.value;
  if (value === 'light' || value === 'dark') return value;
  return 'light';
}
