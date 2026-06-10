import { defineType } from 'trellis/schema';
import { z } from 'zod';

export const GANTT_LANES = ['design', 'engineering', 'ops'] as const;
export type GanttLane = (typeof GANTT_LANES)[number];

export const GanttTask = defineType(
  'GanttTask',
  {
    title: z.string().default(''),
    start: z.string().min(1),
    end: z.string().min(1),
    laneId: z.enum(GANTT_LANES),
    colorIndex: z.number().int().min(0).max(15).default(0),
  },
  { title: 'title' },
);

export type GanttTaskT = import('trellis/schema').InferType<typeof GanttTask>;
