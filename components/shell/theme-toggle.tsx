'use client';

import { useEffect, useState } from 'react';
import { MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from '@/lib/shell/theme';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            className={cn(
              'flex size-9 items-center justify-center rounded-lg text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              className,
            )}
            onClick={toggleTheme}
            aria-label={
              mounted
                ? theme === 'dark'
                  ? 'Switch to light mode'
                  : 'Switch to dark mode'
                : 'Toggle theme'
            }
            suppressHydrationWarning
          />
        }
      >
        {!mounted ? (
          <span className="size-4" aria-hidden />
        ) : theme === 'dark' ? (
          <SunIcon className="size-4" />
        ) : (
          <MoonIcon className="size-4" />
        )}
      </TooltipTrigger>
      {mounted ? (
        <TooltipContent side="right">
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </TooltipContent>
      ) : null}
    </Tooltip>
  );
}
