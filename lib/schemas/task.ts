import { defineType } from 'trellis/schema';
import { z } from 'zod';

export const Task = defineType(
  'Task',
  {
    title: z.string().min(1),
    done: z.boolean(),
  },
  { title: 'title' },
);

export type TaskT = import('trellis/schema').InferType<typeof Task>;
