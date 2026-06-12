'use client';

import { CollectionConfigureTrigger } from '@/components/collections/collection-configure-sheet';
import { HistoryNavButtons } from '@/components/shell/history-nav-buttons';
import { PrimarySidebar } from '@/components/shell/primary-sidebar';
import { SecondarySidebar } from '@/components/shell/secondary-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { embedKickerForPath } from '@/lib/shell/embed';
import { isSquareFractalEmbed } from '@/lib/shell/embed-frame';
import { useEmbedFlags } from '@/lib/shell/use-embed-flags';
import { pageLabel } from '@/lib/shell/modes';
import { ShellProvider, useShell } from '@/lib/shell/shell-context';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { collectionSlug } = useShell();
  const label = pageLabel(pathname);
  const { embed, readonly } = useEmbedFlags();

  useEffect(() => {
    document.documentElement.dataset.embed = embed ? 'true' : 'false';
    document.documentElement.dataset.readonly = readonly ? 'true' : 'false';
    document.body.classList.toggle('shell-embed', embed);
  }, [embed, readonly]);

  const squareFractalEmbed = isSquareFractalEmbed(pathname);
  const viewportFillEmbed =
    squareFractalEmbed || pathname.startsWith('/fractals/ladder');

  // Auto-height for legacy embeds; square viewport-fill frames scroll internally.
  useEffect(() => {
    if (!embed || viewportFillEmbed) return;
    const report = () => {
      window.parent?.postMessage(
        {
          type: 'trellis:embed-height',
          path: location.pathname + location.search,
          height: Math.ceil(document.documentElement.scrollHeight),
        },
        '*',
      );
    };
    const observer = new ResizeObserver(report);
    observer.observe(document.body);
    report();
    const settle = window.setTimeout(report, 300);
    return () => {
      observer.disconnect();
      window.clearTimeout(settle);
    };
  }, [embed, pathname, viewportFillEmbed]);

  const kicker = embed ? embedKickerForPath(pathname, readonly) : null;
  const collectionDetailMatch = pathname.match(/^\/collections\/([^/]+)/);
  const isCollectionDetail =
    collectionDetailMatch != null && collectionDetailMatch[1] !== 'types';

  if (embed) {
    return (
      <div
        className={cn(
          'flex w-full flex-col',
          viewportFillEmbed ? 'h-full min-h-0 overflow-hidden' : 'min-h-full',
        )}
      >
        {!squareFractalEmbed && kicker ? (
          <p className="embed-kicker shrink-0 border-b border-border px-3 py-2 text-sm text-muted-foreground">
            {kicker}
          </p>
        ) : null}
        <main
          className={cn(
            'flex w-full min-w-0 flex-col',
            viewportFillEmbed
              ? 'min-h-0 flex-1 overflow-hidden p-0'
              : 'flex-1 p-3',
          )}
        >
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-svh min-h-svh w-full">
      <PrimarySidebar />
      <SecondarySidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
          {isCollectionDetail ? <HistoryNavButtons /> : null}
          <Breadcrumb className="min-w-0">
            <BreadcrumbList>
              {isCollectionDetail ? (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink render={<Link href="/collections">Collections</Link>} />
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="capitalize">{label}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbPage className="capitalize">{label}</BreadcrumbPage>
                </BreadcrumbItem>
              )}
            </BreadcrumbList>
          </Breadcrumb>
          {isCollectionDetail && collectionSlug ? (
            <CollectionConfigureTrigger
              onClick={() =>
                router.replace(`/collections/${collectionSlug}?configure=general`, {
                  scroll: false,
                })
              }
            />
          ) : null}
        </header>
        <main
          className={cn(
            'flex min-h-0 flex-1 flex-col overflow-auto',
            isCollectionDetail ? 'p-0' : 'p-4',
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ShellProvider>
      <AppShellInner>{children}</AppShellInner>
    </ShellProvider>
  );
}
