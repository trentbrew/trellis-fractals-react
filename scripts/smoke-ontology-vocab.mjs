#!/usr/bin/env node
/**
 * Smoke test for JSON-LD ontology vocabulary routes.
 * Default BASE_URL=http://localhost:3000; override with ONTOLOGY_VOCAB_URL.
 */
const baseUrl = (process.env.ONTOLOGY_VOCAB_URL ?? 'http://localhost:3000').replace(/\/$/, '');

async function assertJson(path, predicate) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, { headers: { Accept: 'application/ld+json' } });
  const contentType = res.headers.get('content-type') ?? '';
  const body = await res.json();

  if (!res.ok) {
    throw new Error(`${path} returned ${res.status}`);
  }
  if (!contentType.includes('application/ld+json') && !contentType.includes('application/json')) {
    throw new Error(`${path} missing JSON content-type: ${contentType}`);
  }
  predicate(body, url);
  console.log(`OK ${path}`);
}

await assertJson('/ns', (body) => {
  if (!body['@context']) throw new Error('/ns missing @context');
  if (!body['@context'].Record) throw new Error('/ns missing trellis Record term');
});

await assertJson('/type/CollectionRecord', (body) => {
  if (body['@id'] !== 'CollectionRecord') throw new Error('CollectionRecord term missing @id');
  if (!Array.isArray(body['trellis:fields']) || body['trellis:fields'].length === 0) {
    throw new Error('CollectionRecord term missing fields');
  }
  const titleField = body['trellis:fields'].find((field) => field.name === 'title');
  if (!titleField) throw new Error('CollectionRecord term missing title field');
});

console.log(`Ontology vocabulary smoke passed (${baseUrl})`);
