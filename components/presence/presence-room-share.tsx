'use client';

import { useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { CheckIcon, CopyIcon, Share2Icon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { buildRoomShareUrl } from '@/lib/presence/share-url';

export function PresenceRoomShare({ sessionRoom }: { sessionRoom: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return buildRoomShareUrl({
      origin: window.location.origin,
      pathname,
      room: sessionRoom,
      search: searchParams.toString() ? `?${searchParams.toString()}` : '',
    });
  }, [pathname, searchParams, sessionRoom]);

  async function copyInviteLink() {
    if (!shareUrl || !navigator.clipboard) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Share room"
          >
            <Share2Icon />
          </Button>
        }
      />

      <DropdownMenuContent align="end" className="w-52">
        <p className="px-2 py-1.5 text-center text-xs text-muted-foreground">
          Invite to{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-[10px]">{sessionRoom}</code>
        </p>

        {shareUrl ? (
          <div className="flex justify-center px-3 py-2">
            <div className="rounded-lg bg-white p-2 shadow-sm ring-1 ring-border">
              <QRCodeSVG
                value={shareUrl}
                size={128}
                level="M"
                marginSize={0}
                aria-label={`QR code for room ${sessionRoom}`}
              />
            </div>
          </div>
        ) : null}

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => void copyInviteLink()} disabled={!shareUrl}>
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? 'Copied!' : 'Copy invite link'}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <p className="px-2 pb-2 text-center text-[10px] leading-snug text-muted-foreground">
          Scan on another device or paste the link — same room, live sync.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
