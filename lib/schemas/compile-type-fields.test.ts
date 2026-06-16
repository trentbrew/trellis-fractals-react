import { describe, expect, it } from 'vitest';
import {
  collectionSlugFromCollectionId,
  compileTypeFieldToOntology,
  compileTypeFieldsToOntology,
} from './compile-type-fields';

describe('compileTypeFieldsToOntology', () => {
  it('maps playground value types to kernel property types', () => {
    expect(
      compileTypeFieldToOntology({
        name: 'active',
        valueType: 'boolean',
        required: true,
      }),
    ).toEqual({
      name: 'active',
      valueType: 'checkbox',
      required: true,
    });

    expect(
      compileTypeFieldToOntology({
        name: 'status',
        valueType: 'enum',
        options: ['open', 'closed'],
      }),
    ).toEqual({
      name: 'status',
      valueType: 'select',
      selectOptions: ['open', 'closed'],
    });
  });

  it('passes numeric and string constraints', () => {
    expect(
      compileTypeFieldToOntology({
        name: 'rating',
        valueType: 'number',
        min: 0,
        max: 5,
      }),
    ).toEqual({
      name: 'rating',
      valueType: 'number',
      min: 0,
      max: 5,
    });

    expect(
      compileTypeFieldToOntology({
        name: 'code',
        valueType: 'string',
        maxLength: 8,
        helpText: 'Short code',
      }),
    ).toEqual({
      name: 'code',
      valueType: 'rich_text',
      maxLength: 8,
      description: 'Short code',
    });
  });

  it('compiles ordered field lists', () => {
    expect(
      compileTypeFieldsToOntology([
        { name: 'title', valueType: 'title', required: true },
        { name: 'email', valueType: 'email' },
      ]),
    ).toEqual([
      { name: 'title', valueType: 'title', required: true },
      { name: 'email', valueType: 'email' },
    ]);
  });

  it('parses collection slug from stable collection ids', () => {
    expect(collectionSlugFromCollectionId('collectionMeta:ideas')).toBe('ideas');
    expect(collectionSlugFromCollectionId('entity:abc')).toBeNull();
  });
});
