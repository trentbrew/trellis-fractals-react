import { defineType } from 'trellis/schema';
import { z } from 'zod';

export const Card = defineType(
  'Card',
  {
    title: z.string().default(''),
    body: z.string().default(''),
    colorIndex: z.number().int().min(0).max(15),
  },
  { title: 'title' },
);

export type CardT = import('trellis/schema').InferType<typeof Card>;
