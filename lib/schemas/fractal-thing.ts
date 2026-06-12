import { defineType } from 'trellis/schema';
import { z } from 'zod';

export const FRACTAL_LANES = ['main', 'agent:demo'] as const;
export type FractalLane = (typeof FRACTAL_LANES)[number];

export const FRACTAL_STATUSES = ['verified', 'review', 'draft'] as const;
export type FractalStatus = (typeof FRACTAL_STATUSES)[number];

export const FractalThing = defineType(
  'FractalThing',
  {
    identity: z.string().min(1),
    title: z.string().min(1),
    collectionId: z.string().min(1),
    laneId: z.enum(FRACTAL_LANES),
    status: z.enum(FRACTAL_STATUSES),
    body: z.string().default(''),
  },
  {
    title: 'title',
    label: 'FractalThing',
  },
);

export type FractalThingT = import('trellis/schema').InferType<typeof FractalThing>;
