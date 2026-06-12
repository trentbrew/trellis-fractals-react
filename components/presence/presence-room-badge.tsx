'use client';

import { useBoardPresence } from '@/lib/presence/context';

export function PresenceRoomBadge() {
  const ctx = useBoardPresence();
  if (!ctx?.enabled) return null;

  const online = ctx.presence.length;

  return (
    <span
      className="hidden text-xs text-muted-foreground sm:inline"
      title="Peers in this presence room"
    >
      Room <code className="rounded bg-muted px-1 py-0.5 text-[10px]">{ctx.sessionRoom}</code>
      {' · '}
      {online} online
    </span>
  );
}
