import { defineType } from 'trellis/schema';
import { z } from 'zod';

export const PLANET_TYPES = ['Rocky planet', 'Gas giant', 'Ice giant'] as const;

export const Planet = defineType(
  'Planet',
  {
    title: z.string().min(1),
    intro: z.string().default(''),
    body: z.string().default(''),
    planetType: z.number().int().min(0).max(2),
    radius: z.number().min(20).max(280),
    colorIndex: z.number().int().min(0).max(15),
    ringRadii: z.array(z.number()).default([]),
  },
  { title: 'title' },
);

export type PlanetT = import('trellis/schema').InferType<typeof Planet>;
