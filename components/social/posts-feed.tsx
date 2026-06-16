'use client';

import { useCallback, useMemo, useState, type FormEvent } from 'react';
import { SendIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/social/post-card';
import { initialsForName } from '@/lib/presence/identity';
import { usePresenceIdentity } from '@/lib/presence/use-presence-identity';
import { PostCommentType, PostLikeType } from '@/lib/schemas/post-interaction';
import { useCollection } from '@/lib/trellis/use-collection';
import { useCollectionBySlug } from '@/lib/trellis/use-collection-by-slug';

export function PostsFeed() {
  const { meta, records, mut, loading, error } = useCollectionBySlug('posts');
  const { rows: likes, mut: likeMut } = useCollection(PostLikeType);
  const { rows: comments, mut: commentMut } = useCollection(PostCommentType);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const identity = usePresenceIdentity();

  const feed = useMemo(() => [...records].reverse(), [records]);

  const likesByPost = useMemo(() => {
    const map = new Map<string, typeof likes>();
    for (const like of likes) {
      const bucket = map.get(like.postId) ?? [];
      bucket.push(like);
      map.set(like.postId, bucket);
    }
    return map;
  }, [likes]);

  const commentsByPost = useMemo(() => {
    const map = new Map<string, typeof comments>();
    for (const comment of comments) {
      const bucket = map.get(comment.postId) ?? [];
      bucket.push(comment);
      map.set(comment.postId, bucket);
    }
    return map;
  }, [comments]);

  const toggleLike = useCallback(
    async (postId: string) => {
      if (!identity) return;
      const existing = likes.find((like) => like.postId === postId && like.author === identity.name);
      if (existing) {
        await likeMut.remove(existing.id);
        return;
      }
      await likeMut.create({
        postId,
        author: identity.name,
        createdAt: Date.now(),
      });
    },
    [identity, likeMut, likes],
  );

  const addComment = useCallback(
    async (postId: string, text: string) => {
      if (!identity) return;
      await commentMut.create({
        postId,
        author: identity.name,
        color: identity.color,
        text,
        createdAt: Date.now(),
      });
    },
    [commentMut, identity],
  );

  async function submit() {
    const text = draft.trim();
    if (!text || posting || !meta) return;
    setPosting(true);
    try {
      const title = text.length > 80 ? `${text.slice(0, 77)}…` : text;
      await mut.create({
        collectionId: meta.id,
        title,
        body: text,
        sortOrder: records.length,
        laneId: 'main',
      });
      setDraft('');
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4" data-testid="posts-feed">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Posts</h1>
        <p className="text-sm text-muted-foreground">
          Short updates in the shared graph. Editable by anyone in this room.
        </p>
      </header>

      {error ? (
        <p className="text-sm text-destructive">Could not load posts. Is Trellis running?</p>
      ) : null}

      <form
        className="rounded-xl border border-border bg-card p-3 shadow-sm"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="flex gap-3">
          <Avatar size="sm" className="mt-1 shrink-0">
            {identity ? (
              <AvatarFallback
                className="text-[10px] font-semibold text-white"
                style={{ backgroundColor: identity.color }}
              >
                {initialsForName(identity.name)}
              </AvatarFallback>
            ) : (
              <AvatarFallback className="bg-muted text-[10px] font-semibold">…</AvatarFallback>
            )}
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <textarea
              placeholder="What's happening?"
              value={draft}
              onChange={(event) => setDraft(event.currentTarget.value)}
              rows={3}
              maxLength={4000}
              className="min-h-[4.5rem] w-full resize-none rounded-md border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0"
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={!draft.trim() || posting || !meta || !identity}>
                <SendIcon data-icon="inline-start" className="size-3.5" />
                Post
              </Button>
            </div>
          </div>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading posts…</p>
      ) : feed.length === 0 ? (
        <p className="text-sm text-muted-foreground">No posts yet. Be the first.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {identity
            ? feed.map((post) => (
                <li key={post.id}>
                  <PostCard
                    post={post}
                    likes={likesByPost.get(post.id) ?? []}
                    comments={commentsByPost.get(post.id) ?? []}
                    identity={identity}
                    onToggleLike={toggleLike}
                    onAddComment={addComment}
                  />
                </li>
              ))
            : null}
        </ul>
      )}
    </div>
  );
}
