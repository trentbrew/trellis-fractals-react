import type { AnyType } from 'trellis/schema';
import { z } from 'zod';
import {
  CollectionMetaType,
  CollectionRecordType,
} from '@/lib/schemas/collection';
import { fieldLabel, innerZodType } from '@/lib/registry/zod-shape';

export const TRELLIS_TYPE_VOCAB = 'https://trellis.computer/type/' as const;
export const TRELLIS_NS = 'https://trellis.computer/ns#' as const;

export const JSON_LD_CONTEXT = {
  '@vocab': TRELLIS_TYPE_VOCAB,
  trellis: TRELLIS_NS,
} as const;

export type TypeTermField = {
  name: string;
  label: string;
  valueType: string;
  required?: boolean;
  comment?: string;
};

export type TypeTermDefinition = {
  term: string;
  label: string;
  extends?: string;
  fields: TypeTermField[];
};

const CORE_TYPE_FIELDS: TypeTermField[] = [
  { name: '@id', label: 'Identifier', valueType: 'iri', comment: 'Entity IRI' },
  { name: '@type', label: 'Type', valueType: 'iri', comment: 'RDF type' },
  { name: 'title', label: 'Title', valueType: 'string' },
  { name: 'body', label: 'Body', valueType: 'string' },
  { name: 'collectionId', label: 'Collection ID', valueType: 'string' },
  { name: 'slug', label: 'Slug', valueType: 'string' },
  { name: 'icon', label: 'Icon', valueType: 'string' },
  { name: 'color', label: 'Color', valueType: 'string' },
  { name: 'description', label: 'Description', valueType: 'string' },
  { name: 'sortOrder', label: 'Sort order', valueType: 'integer' },
  { name: 'laneId', label: 'Lane ID', valueType: 'string' },
  { name: 'defaultView', label: 'Default view', valueType: 'string' },
  { name: 'viewPrefs', label: 'View preferences', valueType: 'object' },
];

function inferValueType(fieldSchema: z.ZodTypeAny): string {
  const inner = innerZodType(fieldSchema);
  if (inner instanceof z.ZodString) return 'string';
  if (inner instanceof z.ZodNumber) return 'integer';
  if (inner instanceof z.ZodBoolean) return 'boolean';
  if (inner instanceof z.ZodEnum) return 'enum';
  if (inner instanceof z.ZodObject) return 'object';
  if (inner instanceof z.ZodDate) return 'date';
  return 'string';
}

function fieldsFromSchema(schema: AnyType): TypeTermField[] {
  const shape = schema.zod.shape as Record<string, z.ZodTypeAny>;
  return Object.entries(shape).map(([name, fieldSchema]) => ({
    name,
    label: fieldLabel(name),
    valueType: inferValueType(fieldSchema),
    required: !(fieldSchema instanceof z.ZodOptional),
  }));
}

function definitionFromSchema(
  schema: AnyType,
  options?: { extends?: string; label?: string },
): TypeTermDefinition {
  return {
    term: schema.type,
    label: options?.label ?? schema.type,
    extends: options?.extends,
    fields: fieldsFromSchema(schema),
  };
}

/** Seed vocabulary terms from built-in collection schemas. */
export function buildTypeTermDefinitions(): Record<string, TypeTermDefinition> {
  const definitions = {
    CollectionMeta: definitionFromSchema(CollectionMetaType, {
      extends: 'trellis:Record',
      label: 'Collection',
    }),
    CollectionRecord: definitionFromSchema(CollectionRecordType, {
      extends: 'trellis:Record',
      label: 'CollectionRecord',
    }),
  };

  const byTerm: Record<string, TypeTermDefinition> = {};
  for (const definition of Object.values(definitions)) {
    byTerm[definition.term] = definition;
  }
  return byTerm;
}

export function buildNamespaceContextDocument() {
  return {
    '@context': {
      '@vocab': TRELLIS_NS,
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      trellis: TRELLIS_NS,
      Record: { '@id': 'trellis:Record', '@type': '@id' },
      Schema: { '@id': 'trellis:Schema', '@type': '@id' },
      fields: { '@id': 'trellis:fields', '@type': '@id' },
      extends: { '@id': 'trellis:extends', '@type': '@id' },
    },
    '@graph': [
      {
        '@id': 'trellis:Record',
        '@type': 'rdfs:Class',
        'rdfs:label': 'Record',
        'rdfs:comment': 'Base Trellis record entity',
      },
      {
        '@id': 'trellis:Schema',
        '@type': 'rdfs:Class',
        'rdfs:label': 'Schema',
        'rdfs:comment': 'Ontology schema definition',
      },
      ...CORE_TYPE_FIELDS.map((field) => ({
        '@id': `trellis:${field.name.replace(/^@/, '')}`,
        '@type': 'rdfs:Property',
        'rdfs:label': field.label,
        ...(field.comment ? { 'rdfs:comment': field.comment } : {}),
      })),
    ],
  };
}

export function buildTypeTermDocument(term: string) {
  const definitions = buildTypeTermDefinitions();
  const definition = definitions[term];
  if (!definition) return null;

  return {
    '@context': {
      ...JSON_LD_CONTEXT,
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      fields: 'trellis:fields',
      extends: 'trellis:extends',
    },
    '@id': definition.term,
    '@type': 'rdfs:Class',
    'rdfs:label': definition.label,
    ...(definition.extends ? { 'trellis:extends': definition.extends } : {}),
    'trellis:fields': definition.fields,
  };
}

export const LD_JSON_HEADERS = {
  'Content-Type': 'application/ld+json; charset=utf-8',
  'Cache-Control': 'public, max-age=3600',
} as const;
