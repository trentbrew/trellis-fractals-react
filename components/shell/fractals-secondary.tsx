'use client';

import {
  AppWindowIcon,
  CircleDotIcon,
  Layers3Icon,
  Rows3Icon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType } from 'react';
import { FRACTAL_ROUTES, type FractalRoute } from '@/lib/shell/fractals';
import { cn } from '@/lib/utils';

const FRACTAL_ICONS: Record<FractalRoute['id'], ComponentType<{ className?: string }>> = {
  entity: CircleDotIcon,
  collection: Layers3Icon,
  page: Rows3Icon,
  app: AppWindowIcon,
};

export function FractalsSecondary() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-3">
      <section>
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Fractals
        </h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Vantage across entity, collection, page, and app containment.
        </p>
        <ul className="mt-2 space-y-0.5">
          {FRACTAL_ROUTES.map((item) => {
            const Icon = FRACTAL_ICONS[item.id];
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
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.status === 'stub' ? (
                    <span className="text-[10px] font-medium text-muted-foreground uppercase">
                      Stub
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
