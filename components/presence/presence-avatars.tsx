'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { initialsForName } from '@/lib/presence/identity';
import { useBoardPresence } from '@/lib/presence/context';

const MAX_VISIBLE = 4;

export function PresenceAvatars() {
  const ctx = useBoardPresence();
  if (!ctx?.enabled || ctx.presence.length === 0) return null;

  const visible = ctx.presence.slice(0, MAX_VISIBLE);
  const overflow = ctx.presence.length - visible.length;

  return (
    <TooltipProvider delay={200}>
      <AvatarGroup className="shrink-0">
        {visible.map((peer) => (
          <Tooltip key={peer.id}>
            <TooltipTrigger className="cursor-default">
              <Avatar size="sm">
                <AvatarFallback
                  className="text-[10px] font-semibold text-white"
                  style={{ backgroundColor: peer.state.color }}
                >
                  {initialsForName(peer.state.name)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {peer.state.name}
              {peer.self ? ' (you)' : ''}
            </TooltipContent>
          </Tooltip>
        ))}
        {overflow > 0 && <AvatarGroupCount>+{overflow}</AvatarGroupCount>}
      </AvatarGroup>
    </TooltipProvider>
  );
}
