import { defineType } from 'trellis/schema';
import { z } from 'zod';

export const CARD_CATEGORIES = ['apparel', 'tech', 'home', 'outdoors', 'food'] as const;

/**
 * The fractal collection's demo entity. Props are deliberately varied by *type*
 * so each vantage band can disclose a different affordance: hue (colorIndex) at
 * dot scale, a category pill + price in list rows, a thumbnail (image) at card
 * scale, tags / rating / brand as cards grow, and the full set in the record.
 * Every prop beyond the original three is optional so the gallery and table
 * boards that also read `Card` keep working unchanged.
 */
export const Card = defineType(
  'Card',
  {
    title: z.string().default(''),
    body: z.string().default(''),
    colorIndex: z.number().int().min(0).max(15),
    image: z.string().optional(),
    brand: z.string().optional(),
    category: z.enum(CARD_CATEGORIES).optional(),
    tags: z.array(z.string()).optional(),
    price: z.number().nonnegative().optional(),
    rating: z.number().min(0).max(5).optional(),
    url: z.string().optional(),
  },
  { title: 'title' },
);

export type CardT = import('trellis/schema').InferType<typeof Card>;
export type CardCategory = (typeof CARD_CATEGORIES)[number];
