'use client';

import { initialsForName } from '@/lib/presence/identity';
import { useBoardPresence } from '@/lib/presence/context';
import type { ShellMode } from '@/lib/shell/modes';
import { shellModeFromPath } from '@/lib/shell/modes';

const MAX_DOTS = 2;

export function PresenceNavBadges({ modeId }: { modeId: ShellMode }) {
  const ctx = useBoardPresence();
  if (!ctx?.enabled) return null;

  const peers = ctx.navPeers.filter((peer) => {
    const route = peer.state.route ?? '';
    if (route.startsWith('/settings')) return false;
    return shellModeFromPath(route) === modeId;
  });
  if (peers.length === 0) return null;

  const shown = peers.slice(0, MAX_DOTS);
  const overflow = peers.length - shown.length;
  const names = peers.map((peer) => peer.state.name).join(', ');

  return (
    <span
      className="pointer-events-none absolute -top-0.5 -right-0.5 z-10 flex items-center"
      title={names}
      aria-label={`Peers in ${modeId}: ${names}`}
    >
      {shown.map((peer, index) => (
        <span
          key={peer.id}
          className="flex size-3 items-center justify-center rounded-full border border-shell-rail text-[7px] font-bold leading-none text-white shadow-sm"
          style={{
            backgroundColor: peer.state.color,
            marginLeft: index > 0 ? -5 : 0,
          }}
        >
          {initialsForName(peer.state.name).slice(0, 1)}
        </span>
      ))}
      {overflow > 0 ? (
        <span className="-ml-1 flex size-3 items-center justify-center rounded-full border border-shell-rail bg-muted text-[7px] font-semibold text-muted-foreground">
          +{overflow}
        </span>
      ) : null}
    </span>
  );
}
