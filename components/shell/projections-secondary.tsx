'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PROJECTION_NAV } from '@/lib/shell/demo-nav';
import { cn } from '@/lib/utils';

export function ProjectionsSecondary() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-3">
      <section>
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Projection skeletons
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Fixture boards — structurally diverse, semantically meaningless.
        </p>
        <ul className="mt-2 space-y-0.5">
          {PROJECTION_NAV.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
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
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
