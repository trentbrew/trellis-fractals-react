#!/usr/bin/env node
/**
 * Register CollectionMeta + CollectionRecord ontologies via HTTP (idempotent).
 *
 *   node scripts/register-collection-ontology.mjs
 *   TRELLIS_URL=http://localhost:8230 node scripts/register-collection-ontology.mjs
 */
import { authHeaders, trellisEnv } from './trellis-config.mjs';

const { base: TRELLIS_URL, apiKey } = trellisEnv();

const ONTOLOGIES = [
  {
    '@id': 'https://trellis.dev/ns/demo/v1/CollectionMeta',
    '@type': 'trellis:Schema',
    version: '1.0.0',
    tier: 'user',
    subClassOf: 'core:Record',
    label: 'CollectionMeta',
    fields: [
      { name: 'title', valueType: 'title', required: true },
      { name: 'slug', valueType: 'rich_text', required: true },
      { name: 'icon', valueType: 'rich_text' },
      { name: 'color', valueType: 'rich_text' },
      { name: 'description', valueType: 'rich_text' },
      { name: 'sortOrder', valueType: 'number' },
    ],
  },
  {
    '@id': 'https://trellis.dev/ns/demo/v1/CollectionRecord',
    '@type': 'trellis:Schema',
    version: '1.0.0',
    tier: 'user',
    subClassOf: 'core:Record',
    label: 'CollectionRecord',
    fields: [
      { name: 'collectionId', valueType: 'rich_text', required: true },
      { name: 'title', valueType: 'title', required: true },
      { name: 'body', valueType: 'rich_text' },
      { name: 'sortOrder', valueType: 'number' },
      { name: 'laneId', valueType: 'rich_text' },
    ],
  },
];

async function api(method, path, body) {
  const res = await fetch(`${TRELLIS_URL}${path}`, {
    method,
    headers: authHeaders(apiKey),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

for (const ontology of ONTOLOGIES) {
  const post = await api('POST', '/ontologies', ontology);
  if (post.ok) {
    console.log(`✓ Registered ${ontology.label}`);
    continue;
  }
  const message = post.data?.message ?? '';
  if (post.status === 409 || String(message).includes('already exists')) {
    const patch = await api('PATCH', `/ontologies/${encodeURIComponent(ontology['@id'])}`, {
      fields: ontology.fields,
    });
    if (patch.ok) {
      console.log(`✓ Updated ${ontology.label}`);
    } else {
      console.log(`✓ ${ontology.label} already present`);
    }
    continue;
  }
  throw new Error(`HTTP ${post.status}: ${message || 'register failed'}`);
}
