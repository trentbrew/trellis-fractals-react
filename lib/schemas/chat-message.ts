import { defineType, type InferType } from 'trellis/schema';
import { z } from 'zod';

const room = z.string().min(1).max(64);

export const ChatMessageType = defineType(
  'message',
  {
    room,
    author: z.string().min(1).max(40),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'color must be a 6-digit hex string'),
    text: z.string().min(1).max(2000),
    createdAt: z.number(),
  },
  { title: 'text' },
);

export type ChatMessage = InferType<typeof ChatMessageType>;

export function sortChatMessages(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}
