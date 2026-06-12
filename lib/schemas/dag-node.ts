import { defineType } from 'trellis/schema';
import { z } from 'zod';

export const DagNode = defineType(
  'DagNode',
  {
    title: z.string().default(''),
    parentId: z.string().optional(),
    dependsOn: z.array(z.string()).default([]),
    colorIndex: z.number().int().min(0).max(15).default(0),
    fixtureKey: z.string().optional(),
  },
  { title: 'title' },
);

export type DagNodeT = import('trellis/schema').InferType<typeof DagNode>;
