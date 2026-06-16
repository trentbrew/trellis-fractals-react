'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { SendIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChatMessageType, sortChatMessages, type ChatMessage } from '@/lib/schemas/chat-message';
import { initialsForName } from '@/lib/presence/identity';
import { usePresenceIdentity } from '@/lib/presence/use-presence-identity';
import { useSessionRoom } from '@/lib/shell/session-room';
import { useCollection } from '@/lib/trellis/use-collection';
import { cn } from '@/lib/utils';

function formatTime(ts: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(ts));
}

function groupMessages(messages: ChatMessage[]): ChatMessage[][] {
  const groups: ChatMessage[][] = [];
  for (const message of messages) {
    const previous = groups.at(-1)?.at(-1);
    const sameAuthor = previous?.author === message.author;
    const closeInTime = previous && message.createdAt - previous.createdAt < 5 * 60_000;
    if (sameAuthor && closeInTime) {
      groups.at(-1)?.push(message);
    } else {
      groups.push([message]);
    }
  }
  return groups;
}

export function GroupChat() {
  const sessionRoom = useSessionRoom() ?? 'lobby';
  const identity = usePresenceIdentity();
  const { rows, mut, loading, error } = useCollection(ChatMessageType, {
    where: { room: sessionRoom },
  });
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(() => sortChatMessages(rows), [rows]);
  const messageGroups = useMemo(() => groupMessages(messages), [messages]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function sendMessage() {
    const text = draft.trim();
    if (!text || sending || !identity) return;
    setSending(true);
    setDraft('');
    try {
      await mut.create({
        room: sessionRoom,
        author: identity.name,
        color: identity.color,
        text,
        createdAt: Date.now(),
      });
    } finally {
      setSending(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await sendMessage();
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col" data-testid="group-chat">
      {error ? (
        <p className="shrink-0 px-4 py-2 text-sm text-destructive">
          Could not load chat. Is Trellis running?
        </p>
      ) : null}

      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet. Say hello.</p>
        ) : (
          <div className="space-y-4">
            {messageGroups.map((group) => {
              const head = group[0];
              return (
                <div key={head.id} className="flex gap-3">
                  <Avatar size="sm" className="mt-0.5 shrink-0">
                    <AvatarFallback
                      className="text-[10px] font-semibold text-white"
                      style={{ backgroundColor: head.color }}
                    >
                      {initialsForName(head.author)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold" style={{ color: head.color }}>
                        {head.author}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(head.createdAt)}
                      </span>
                    </div>
                    {group.map((message) => {
                      const mine = identity ? message.author === identity.name : false;
                      return (
                        <p
                          key={message.id}
                          className={cn(
                            'text-sm leading-relaxed text-foreground',
                            mine && 'rounded-md bg-primary/10 px-2 py-1',
                          )}
                        >
                          {message.text}
                        </p>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <form
        className="shrink-0 border-t border-border bg-background px-4 py-3"
        onSubmit={submit}
      >
        <div className="flex items-end gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
          <textarea
            placeholder={`Message #${sessionRoom}`}
            value={draft}
            onChange={(event) => setDraft(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void sendMessage();
              }
            }}
            rows={1}
            maxLength={2000}
            autoComplete="off"
            className="max-h-32 min-h-[1.5rem] flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button type="submit" size="icon-sm" disabled={!draft.trim() || sending || !identity}>
            <SendIcon className="size-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
