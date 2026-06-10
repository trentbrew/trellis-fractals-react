import { defineType } from 'trellis/schema';
import { z } from 'zod';

export const KANBAN_STATUSES = ['backlog', 'doing', 'done'] as const;
export type KanbanStatus = (typeof KANBAN_STATUSES)[number];

export const KanbanCard = defineType(
  'KanbanCard',
  {
    title: z.string().default(''),
    status: z.enum(KANBAN_STATUSES),
  },
  { title: 'title' },
);

export type KanbanCardT = import('trellis/schema').InferType<typeof KanbanCard>;
