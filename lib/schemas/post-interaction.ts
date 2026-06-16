import { defineType, type InferType } from 'trellis/schema';
import { z } from 'zod';

const postId = z.string().min(1);
const author = z.string().min(1).max(40);
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'color must be a 6-digit hex string');

export const PostLikeType = defineType(
  'post-like',
  {
    postId,
    author,
    createdAt: z.number(),
  },
  { title: 'author' },
);

export const PostCommentType = defineType(
  'post-comment',
  {
    postId,
    author,
    color,
    text: z.string().min(1).max(1000),
    createdAt: z.number(),
  },
  { title: 'text' },
);

export type PostLike = InferType<typeof PostLikeType>;
export type PostComment = InferType<typeof PostCommentType>;

export function sortPostComments(comments: PostComment[]): PostComment[] {
  return [...comments].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}
