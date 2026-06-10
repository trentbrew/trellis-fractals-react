import { defineType } from 'trellis/schema';
import { z } from 'zod';

export const CalendarEvent = defineType(
  'CalendarEvent',
  {
    title: z.string().default(''),
    start: z.string().min(1),
    end: z.string().min(1),
    allDay: z.boolean().default(false),
    colorIndex: z.number().int().min(0).max(15).default(0),
  },
  { title: 'title' },
);

export type CalendarEventT = import('trellis/schema').InferType<typeof CalendarEvent>;
