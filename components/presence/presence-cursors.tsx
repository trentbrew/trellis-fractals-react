'use client';

import { useBoardPresence } from '@/lib/presence/context';
import { viewportToFixed } from '@/lib/presence/coordinate-space';
import { OFFSCREEN, peerHasCellFocus } from '@/lib/presence/types';

function PresencePointer() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="drop-shadow-sm">
      <path
        d="M2 2 L2 16 L6 12 L9 18 L11 17 L8 11 L14 11 Z"
        fill="currentColor"
        stroke="white"
        strokeWidth={1}
      />
    </svg>
  );
}

function RemoteCursor({
  name,
  color,
  x,
  y,
}: {
  name: string;
  color: string;
  x: number;
  y: number;
}) {
  const position = viewportToFixed(x, y);

  return (
    <div
      className="pointer-events-none fixed z-50 transition-[left,top] duration-[60ms] ease-linear will-change-[left,top]"
      style={{
        left: position.left,
        top: position.top,
        color,
        transform: 'translate(-2px, -2px)',
      }}
    >
      <PresencePointer />
      <span
        className="absolute top-3 left-4 max-w-40 truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm"
        style={{ backgroundColor: color }}
      >
        {name}
      </span>
    </div>
  );
}

export function PresenceCursors() {
  const ctx = useBoardPresence();
  if (!ctx?.enabled) return null;

  const remote = ctx.others.filter(
    (peer) =>
      peer.state.x >= 0 &&
      peer.state.y >= 0 &&
      peer.state.x !== OFFSCREEN &&
      !peerHasCellFocus(peer.state),
  );

  if (remote.length === 0) return null;

  return (
    <>
      {remote.map((peer) => (
        <RemoteCursor
          key={peer.id}
          name={peer.state.name}
          color={peer.state.color}
          x={peer.state.x}
          y={peer.state.y}
        />
      ))}
    </>
  );
}
