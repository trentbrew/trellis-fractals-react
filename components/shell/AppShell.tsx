'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { CORPUS_DEMOS, MOTION_LABS, currentDemoId } from '@/lib/shell/demos';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = currentDemoId(pathname);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-4 border-b border-border px-4 py-3">
        <span className="text-sm font-semibold tracking-wide text-muted-foreground">
          fractals
        </span>
        <nav className="flex flex-wrap items-center gap-1" aria-label="Demos">
          {CORPUS_DEMOS.map((demo) => (
            <Link
              key={demo.id}
              href={demo.href}
              data-active={active === demo.id ? 'true' : undefined}
              className={cn(
                'rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                active === demo.id && 'bg-muted text-foreground',
              )}
            >
              {demo.label}
            </Link>
          ))}
          <span className="mx-1 text-muted-foreground" aria-hidden="true">
            ·
          </span>
          <span className="mr-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Motion labs
          </span>
          {MOTION_LABS.map((demo) => (
            <Link
              key={demo.id}
              href={demo.href}
              data-active={active === demo.id ? 'true' : undefined}
              className={cn(
                'rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                active === demo.id && 'bg-muted text-foreground',
              )}
            >
              {demo.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex flex-1 flex-col p-4">{children}</main>
    </div>
  );
}
