import {
  collectionRecordTypeId,
  DEFAULT_COLLECTION_RECORD_FIELDS,
  type TypeField,
} from '@/lib/schemas/collection';
import { withSystemRecordFields } from '@/lib/registry/type-columns';
import { DEMO_TYPE_SEEDS } from '@/lib/trellis/demo-type-seeds';
import { readOntologyOverlay, writeOntologyOverlay } from '@/lib/trellis/ontology-overlay';
import {
  ontologyOverlayPath,
  trellisAuthHeaders,
  trellisServerConfig,
} from '@/lib/trellis/trellis-server-config';
import type { TypeDef, TypeUpdate } from '@/lib/trellis/use-types';

type CollectionMetaRow = {
  id: string;
  slug?: string;
  title?: string;
};

function mergeOntology(
  base: TypeDef,
  overlay?: Partial<TypeDef>,
): TypeDef {
  if (!overlay) return base;
  return {
    ...base,
    ...overlay,
    '@id': base['@id'],
    fields: overlay.fields ?? base.fields,
  };
}

function synthesizeCollectionOntology(meta: CollectionMetaRow): TypeDef {
  const slug = meta.slug ?? meta.id;
  return {
    '@id': collectionRecordTypeId(slug),
    label: meta.title ? `${meta.title} records` : `${slug} records`,
    fields: withSystemRecordFields(DEFAULT_COLLECTION_RECORD_FIELDS),
  };
}

async function fetchCollectionMetas(origin: string, apiKey?: string): Promise<CollectionMetaRow[]> {
  const url = new URL('/entities', origin);
  url.searchParams.set('type', 'CollectionMeta');
  url.searchParams.set('limit', '200');

  const res = await fetch(url, { headers: trellisAuthHeaders(apiKey), cache: 'no-store' });
  if (!res.ok) return [];

  const json = (await res.json()) as { data?: CollectionMetaRow[] } | CollectionMetaRow[];
  const rows = Array.isArray(json) ? json : (json.data ?? []);
  return rows.filter((row) => row.slug || row.id);
}

export async function listOntologiesServer(cwd?: string): Promise<TypeDef[]> {
  const config = trellisServerConfig(cwd);
  const overlay = readOntologyOverlay(ontologyOverlayPath(config.dbPath!));
  const byId = new Map<string, TypeDef>();

  for (const seed of DEMO_TYPE_SEEDS) {
    byId.set(seed['@id'], mergeOntology(seed, overlay[seed['@id']]));
  }

  const metas = await fetchCollectionMetas(config.origin, config.apiKey);
  for (const meta of metas) {
    const base = synthesizeCollectionOntology(meta);
    byId.set(base['@id'], mergeOntology(base, overlay[base['@id']]));
  }

  for (const [id, ontology] of Object.entries(overlay)) {
    if (!byId.has(id)) {
      byId.set(id, ontology);
    }
  }

  return [...byId.values()];
}

export async function patchOntologyServer(
  id: string,
  updates: TypeUpdate,
  cwd?: string,
): Promise<TypeDef> {
  const config = trellisServerConfig(cwd);
  const overlayPath = ontologyOverlayPath(config.dbPath!);
  const overlay = readOntologyOverlay(overlayPath);
  const existing =
    overlay[id] ?? (await listOntologiesServer(cwd)).find((ontology) => ontology['@id'] === id);

  if (!existing) {
    throw new OntologyNotFoundError(id);
  }

  const merged: TypeDef = {
    ...existing,
    ...updates,
    '@id': id,
    fields: (updates.fields as TypeField[] | undefined) ?? existing.fields,
  };

  overlay[id] = merged;
  writeOntologyOverlay(overlayPath, overlay);

  await syncOntologyToSidecar(config.origin, config.apiKey, merged).catch(() => {
    // Sidecar may already hold a stale copy; overlay is authoritative for GET.
  });

  return merged;
}

export async function proxyCreateOntology(
  body: unknown,
  cwd?: string,
): Promise<Response> {
  const config = trellisServerConfig(cwd);
  const res = await fetch(`${config.origin}/ontologies`, {
    method: 'POST',
    headers: trellisAuthHeaders(config.apiKey),
    body: JSON.stringify(body),
  });

  if (res.ok || res.status === 409) {
    const def = body as TypeDef;
    if (def?.['@id']) {
      const overlayPath = ontologyOverlayPath(config.dbPath!);
      const overlay = readOntologyOverlay(overlayPath);
      overlay[def['@id']] = mergeOntology(
        overlay[def['@id']] ?? { '@id': def['@id'], label: def.label, fields: def.fields ?? [] },
        def,
      );
      writeOntologyOverlay(overlayPath, overlay);
    }
  }

  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' },
  });
}

async function syncOntologyToSidecar(
  origin: string,
  apiKey: string | undefined,
  ontology: TypeDef,
): Promise<void> {
  const payload = {
    '@id': ontology['@id'],
    '@type': 'trellis:Schema',
    version: '1.0.0',
    tier: 'user',
    subClassOf: 'core:Record',
    label: ontology.label,
    fields: ontology.fields ?? [],
    ...(ontology.icon !== undefined ? { icon: ontology.icon } : {}),
    ...(ontology.color !== undefined ? { color: ontology.color } : {}),
  };

  await fetch(`${origin}/ontologies`, {
    method: 'POST',
    headers: trellisAuthHeaders(apiKey),
    body: JSON.stringify(payload),
  });
}

export class OntologyNotFoundError extends Error {
  constructor(id: string) {
    super(`Ontology ${id} not found`);
    this.name = 'OntologyNotFoundError';
  }
}
