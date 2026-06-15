import { describe, expect, it } from 'vitest';

import {
  JSON_LD_CONTEXT,
  TRELLIS_NS,
  TRELLIS_TYPE_VOCAB,
  buildNamespaceContextDocument,
  buildTypeTermDefinitions,
  buildTypeTermDocument,
} from '@/lib/json-ld/context';

describe('json-ld vocabulary context', () => {
  it('exports the shared JSON-LD context URLs', () => {
    expect(JSON_LD_CONTEXT).toEqual({
      '@vocab': 'https://trellis.computer/type/',
      trellis: 'https://trellis.computer/ns#',
    });
    expect(TRELLIS_TYPE_VOCAB).toBe('https://trellis.computer/type/');
    expect(TRELLIS_NS).toBe('https://trellis.computer/ns#');
  });

  it('seeds CollectionMeta and CollectionRecord term definitions', () => {
    const definitions = buildTypeTermDefinitions();
    expect(Object.keys(definitions).sort()).toEqual(['CollectionMeta', 'CollectionRecord']);
    expect(definitions.CollectionRecord.fields.map((field) => field.name)).toEqual([
      'collectionId',
      'title',
      'body',
      'sortOrder',
      'laneId',
    ]);
    expect(definitions.CollectionMeta.fields.map((field) => field.name)).toEqual([
      'title',
      'slug',
      'icon',
      'color',
      'description',
      'sortOrder',
      'defaultView',
      'viewPrefs',
    ]);
  });

  it('builds namespace context with trellis terms', () => {
    const document = buildNamespaceContextDocument();
    expect(document['@context']).toMatchObject({
      '@vocab': TRELLIS_NS,
      Record: { '@id': 'trellis:Record' },
      Schema: { '@id': 'trellis:Schema' },
    });
    expect(document['@graph'].some((node) => node['@id'] === 'trellis:Record')).toBe(true);
  });

  it('builds CollectionRecord term document from schema fields', () => {
    const document = buildTypeTermDocument('CollectionRecord');
    expect(document).not.toBeNull();
    expect(document?.['@id']).toBe('CollectionRecord');
    expect(document?.['rdfs:label']).toBe('CollectionRecord');
    expect(document?.['trellis:fields']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'title', required: true }),
        expect.objectContaining({ name: 'collectionId', required: true }),
      ]),
    );
  });

  it('returns null for unknown terms', () => {
    expect(buildTypeTermDocument('UnknownType')).toBeNull();
  });
});
