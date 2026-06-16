'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { SearchIcon, XIcon } from 'lucide-react';
import { PresenceLinkBadge } from '@/components/presence/presence-link-badge';
import { DEMO_SURFACE_NAV } from '@/lib/shell/demo-nav';
import { matchesSidebarQuery } from '@/lib/shell/sidebar-search';
import { cn } from '@/lib/utils';

export function ProjectionsSecondary() {
  const pathname = usePathname();
  const [sidebarQuery, setSidebarQuery] = useState('');

  const filtered = useMemo(
    () =>
      DEMO_SURFACE_NAV.filter((item) => matchesSidebarQuery(item.label, sidebarQuery)),
    [sidebarQuery],
  );

  return (
    <div className="flex h-full min-h-full flex-1 flex-col">
      <div className="flex h-12 shrink-0 items-center border-b border-border px-3">
        <div className="relative w-full">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            className="h-8 w-full rounded-md border-0 bg-transparent pr-8 pl-8 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
            placeholder="Search social…"
            value={sidebarQuery}
            onChange={(event) => setSidebarQuery(event.currentTarget.value)}
            aria-label="Search social surfaces"
            data-testid="sidebar-search"
          />
          {sidebarQuery ? (
            <button
              type="button"
              className="absolute top-1/2 right-2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setSidebarQuery('')}
              aria-label="Clear sidebar search"
            >
              <XIcon className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3" aria-label="Social">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground">No matching surfaces.</p>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted',
                      isActive && 'bg-muted font-medium',
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    <PresenceLinkBadge route={item.href} className="ml-auto" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </div>
  );
}
