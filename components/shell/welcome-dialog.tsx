'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { dismissWelcome, isWelcomeDismissed } from '@/lib/shell/welcome-storage';
import { useEmbedFlags } from '@/lib/shell/use-embed-flags';

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

export function WelcomeDialog() {
  const { embed } = useEmbedFlags();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (embed || isWelcomeDismissed()) return;
    setOpen(true);
  }, [embed]);

  function handleDismiss() {
    dismissWelcome();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
            <span
              className="size-8 shrink-0 bg-foreground"
              style={logoMaskStyle}
              aria-hidden
            />
            Welcome
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            This is a public sandbox anyone can edit; data may reset. Open another tab or device to try
            realtime cursors and live presence.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" onClick={handleDismiss}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
