'use client';

import { initialsForName } from '@/lib/presence/identity';
import { useBoardPresence } from '@/lib/presence/context';
import { cn } from '@/lib/utils';

const MAX_AVATARS = 2;

function normalizePath(path: string): string {
  return path.replace(/\/+$/, '') || '/';
}

/**
 * Does a peer's current route land on `linkHref`? The pathname must match, and
 * any query params the link itself specifies (e.g. `?type=Foo`) must be present
 * on the peer's route. Transient UI params the peer carries (`?record`,
 * `?configure`, …) are ignored, so the badge stays put when a peer opens a
 * dialog on the same page.
 */
function peerMatchesLink(linkHref: string, peerRoute: string): boolean {
  const [linkPath, linkQuery = ''] = linkHref.split('?');
  const [peerPath, peerQuery = ''] = peerRoute.split('?');
  if (normalizePath(linkPath) !== normalizePath(peerPath)) return false;
  if (!linkQuery) return true;

  const peerParams = new URLSearchParams(peerQuery);
  for (const [key, value] of new URLSearchParams(linkQuery)) {
    if (peerParams.get(key) !== value) return false;
  }
  return true;
}

/**
 * Tiny avatar cluster shown inside a navigation link/sidebar item when a remote
 * peer is currently viewing that route. Matches against session-wide
 * {@link useBoardPresence navPeers} (each peer broadcasts its route), so it works
 * across pages even though cursor presence is page-scoped.
 */
export function PresenceLinkBadge({
  route,
  className,
}: {
  route: string;
  className?: string;
}) {
  const ctx = useBoardPresence();
  if (!ctx?.enabled) return null;

  const peers = ctx.navPeers.filter((peer) =>
    peerMatchesLink(route, peer.state.route ?? ''),
  );
  if (peers.length === 0) return null;

  const shown = peers.slice(0, MAX_AVATARS);
  const overflow = peers.length - shown.length;
  const names = peers.map((peer) => peer.state.name).join(', ');

  return (
    <span
      className={cn('pointer-events-none flex shrink-0 items-center', className)}
      title={names}
      aria-label={`Viewing here: ${names}`}
    >
      {shown.map((peer, index) => (
        <span
          key={peer.id}
          className="flex size-4 items-center justify-center rounded-full border border-background text-[8px] font-bold leading-none text-white shadow-sm"
          style={{
            backgroundColor: peer.state.color,
            marginLeft: index > 0 ? -6 : 0,
          }}
        >
          {initialsForName(peer.state.name).slice(0, 1)}
        </span>
      ))}
      {overflow > 0 ? (
        <span className="-ml-1 flex size-4 items-center justify-center rounded-full border border-background bg-muted text-[8px] font-semibold text-muted-foreground shadow-sm">
          +{overflow}
        </span>
      ) : null}
    </span>
  );
}
