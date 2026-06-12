'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HistoryNavButtons() {
  const router = useRouter();
  const [canGoForward, setCanGoForward] = useState(false);

  useEffect(() => {
    const onPopState = () => setCanGoForward(true);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <div className="flex shrink-0 items-center gap-0.5" data-testid="history-nav-buttons">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Go back"
        onClick={() => {
          router.back();
          setCanGoForward(true);
        }}
      >
        <ArrowLeftIcon className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Go forward"
        disabled={!canGoForward}
        onClick={() => router.forward()}
      >
        <ArrowRightIcon className="size-4" />
      </Button>
    </div>
  );
}
