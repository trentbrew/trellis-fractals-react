'use client';

import { useMemo, useState } from 'react';
import { HeartIcon, MessageSquareIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { htmlToPlainText } from '@/lib/links/trellis-mention';
import { initialsForName, type PresenceIdentity } from '@/lib/presence/identity';
import type { CollectionRecord } from '@/lib/schemas/collection';
import type { PostComment, PostLike } from '@/lib/schemas/post-interaction';
import { sortPostComments } from '@/lib/schemas/post-interaction';
import { cn } from '@/lib/utils';

function formatTime(ts: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(ts));
}

function relativeAge(createdAt?: number): string {
  if (!createdAt) return '';
  const minutes = Math.max(1, Math.floor((Date.now() - createdAt) / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

type PostCardProps = {
  post: CollectionRecord;
  likes: PostLike[];
  comments: PostComment[];
  identity: PresenceIdentity;
  onToggleLike: (postId: string) => Promise<void>;
  onAddComment: (postId: string, text: string) => Promise<void>;
};

export function PostCard({
  post,
  likes,
  comments,
  identity,
  onToggleLike,
  onAddComment,
}: PostCardProps) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [commenting, setCommenting] = useState(false);

  const bodyText = useMemo(() => htmlToPlainText(post.body), [post.body]);
  const showBody = bodyText.length > 0 && bodyText !== post.title;
  const sortedComments = useMemo(() => sortPostComments(comments), [comments]);
  const liked = likes.some((like) => like.author === identity.name);
  const createdAt = (post as CollectionRecord & { createdAt?: number }).createdAt;

  async function submitComment(event: React.FormEvent) {
    event.preventDefault();
    const text = commentDraft.trim();
    if (!text || commenting) return;
    setCommenting(true);
    try {
      await onAddComment(post.id, text);
      setCommentDraft('');
      setCommentsOpen(true);
    } finally {
      setCommenting(false);
    }
  }

  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex gap-3">
        <Avatar size="sm" className="shrink-0">
          <AvatarFallback className="bg-muted text-[10px] font-semibold">
            {initialsForName(post.title)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
            <span className="font-semibold">{post.title}</span>
            {createdAt ? (
              <span className="text-xs text-muted-foreground">· {relativeAge(createdAt)}</span>
            ) : null}
          </div>
          {showBody ? (
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{bodyText}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-1 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn('h-8 gap-1.5 px-2 text-muted-foreground', liked && 'text-rose-500')}
              onClick={() => void onToggleLike(post.id)}
            >
              <HeartIcon className={cn('size-3.5', liked && 'fill-current')} />
              <span>{likes.length > 0 ? likes.length : 'Like'}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 px-2 text-muted-foreground"
              onClick={() => setCommentsOpen((open) => !open)}
            >
              <MessageSquareIcon className="size-3.5" />
              <span>{sortedComments.length > 0 ? sortedComments.length : 'Comment'}</span>
            </Button>
          </div>

          {commentsOpen ? (
            <div className="space-y-3 border-t border-border pt-3">
              {sortedComments.length === 0 ? (
                <p className="text-xs text-muted-foreground">No comments yet.</p>
              ) : (
                <ul className="space-y-2">
                  {sortedComments.map((comment) => (
                    <li key={comment.id} className="flex gap-2 text-sm">
                      <Avatar size="sm" className="size-6 shrink-0">
                        <AvatarFallback
                          className="text-[9px] font-semibold text-white"
                          style={{ backgroundColor: comment.color }}
                        >
                          {initialsForName(comment.author)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground">
                          <span className="font-medium" style={{ color: comment.color }}>
                            {comment.author}
                          </span>
                          <span>{formatTime(comment.createdAt)}</span>
                        </div>
                        <p className="leading-relaxed text-foreground">{comment.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <form className="flex items-center gap-2" onSubmit={submitComment}>
                <Input
                  placeholder="Write a comment…"
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.currentTarget.value)}
                  maxLength={1000}
                  autoComplete="off"
                />
                <Button type="submit" size="sm" disabled={!commentDraft.trim() || commenting}>
                  Reply
                </Button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
