import { z } from 'zod';

const LABEL_OVERRIDES: Record<string, string> = {
  title: 'Title',
  body: 'Description',
  createdAt: 'Created',
  status: 'Status',
  start: 'Start',
  end: 'End',
};

/** Strip optional/nullable/default wrappers from a Zod field schema. */
export function unwrapZod(schema: z.ZodTypeAny): z.ZodTypeAny {
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return unwrapZod(schema._def.innerType as z.ZodTypeAny);
  }
  if (schema instanceof z.ZodDefault) {
    return unwrapZod(schema._def.innerType as z.ZodTypeAny);
  }
  return schema;
}

export function innerZodType(fieldSchema: z.ZodTypeAny): z.ZodTypeAny {
  return unwrapZod(fieldSchema);
}

export function fieldLabel(key: string): string {
  if (LABEL_OVERRIDES[key]) return LABEL_OVERRIDES[key];
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}
