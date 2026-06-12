'use client';

import { useBoardPresence } from '@/lib/presence/context';
import { OFFSCREEN } from '@/lib/presence/types';

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
  return (
    <div
      className="pointer-events-none absolute transition-[left,top] duration-[60ms] ease-linear will-change-[left,top]"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
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
    (peer) => peer.state.x >= 0 && peer.state.y >= 0 && peer.state.x !== OFFSCREEN,
  );

  const showSelf =
    ctx.selfCursor != null &&
    ctx.selfCursor.x >= 0 &&
    ctx.selfCursor.y >= 0 &&
    ctx.selfCursor.x !== OFFSCREEN;

  if (remote.length === 0 && !showSelf) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {remote.map((peer) => (
        <RemoteCursor
          key={peer.id}
          name={peer.state.name}
          color={peer.state.color}
          x={peer.state.x}
          y={peer.state.y}
        />
      ))}
      {showSelf && ctx.selfCursor && (
        <div
          className="pointer-events-none absolute"
          style={{
            left: `${ctx.selfCursor.x * 100}%`,
            top: `${ctx.selfCursor.y * 100}%`,
            color: ctx.identity.color,
            transform: 'translate(-2px, -2px)',
          }}
        >
          <PresencePointer />
          <span
            className="absolute top-3 left-4 max-w-40 truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm"
            style={{ backgroundColor: ctx.identity.color }}
          >
            {ctx.identity.name} (you)
          </span>
        </div>
      )}
    </div>
  );
}
