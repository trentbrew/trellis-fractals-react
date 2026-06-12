'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PRIMARY_NAV } from '@/lib/shell/modes';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/shell/theme-toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const logoMaskStyle = {
  WebkitMaskImage: 'url(/logo.png)',
  maskImage: 'url(/logo.png)',
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
} as const;

export function PrimarySidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full min-h-full w-14 shrink-0 flex-col self-stretch border-r border-border bg-sidebar">
      <div className="flex h-12 shrink-0 items-center justify-center border-b border-border">
        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                href="/collections"
                className="flex size-8 items-center justify-center rounded-md"
                aria-label="Fractals"
              />
            }
          >
            <span
              className="size-7 bg-foreground"
              style={logoMaskStyle}
              aria-hidden
            />
          </TooltipTrigger>
          <TooltipContent side="right">fractals</TooltipContent>
        </Tooltip>
      </div>

      <nav
        className="flex flex-col items-center gap-1 p-2 pt-3"
        aria-label="App modes"
      >
        {PRIMARY_NAV.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.id === 'fractals'
              ? pathname.startsWith('/grid') || pathname.startsWith('/planets')
                || pathname === item.href
                || pathname.startsWith(`${item.href}/`)
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Tooltip key={item.id}>
              <TooltipTrigger
                render={
                  <Link
                    href={item.href}
                    className={cn(
                      'flex size-9 items-center justify-center rounded-lg text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isActive &&
                        'bg-sidebar-accent text-sidebar-accent-foreground',
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  />
                }
              >
                <Icon className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className="mt-auto flex shrink-0 flex-col items-center border-t border-border p-2">
        <ThemeToggle />
      </div>
    </aside>
  );
}
