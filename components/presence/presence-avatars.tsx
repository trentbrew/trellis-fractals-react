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
import { cn } from '@/lib/utils';

const MAX_VISIBLE = 4;

export function PresenceAvatars() {
  const ctx = useBoardPresence();
  if (!ctx?.enabled || ctx.sessionPresence.length === 0) return null;

  const visible = ctx.sessionPresence.slice(0, MAX_VISIBLE);
  const overflow = ctx.sessionPresence.length - visible.length;

  return (
    <TooltipProvider delay={200}>
      <AvatarGroup className="shrink-0 *:data-[slot=avatar]:ring-1 *:data-[slot=avatar]:ring-background">
        {visible.map((peer) => (
          <Tooltip key={peer.id}>
            <TooltipTrigger className="cursor-default">
              <Avatar size="sm" className="after:border-background">
                <AvatarFallback
                  className={cn(
                    'text-[10px] font-semibold transition-colors',
                    peer.state.away
                      ? 'bg-muted text-muted-foreground'
                      : 'text-white',
                  )}
                  style={
                    peer.state.away ? undefined : { backgroundColor: peer.state.color }
                  }
                >
                  {initialsForName(peer.state.name)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {peer.state.name}
              {peer.self ? ' (you)' : ''}
              {peer.state.away ? ' · away' : ''}
              {peer.state.route ? ` · ${peer.state.route}` : ''}
            </TooltipContent>
          </Tooltip>
        ))}
        {overflow > 0 && <AvatarGroupCount>+{overflow}</AvatarGroupCount>}
      </AvatarGroup>
    </TooltipProvider>
  );
}
