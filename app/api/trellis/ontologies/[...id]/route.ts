import { parseJsonBody } from '@/lib/trellis/parse-json-body';
import { OntologyNotFoundError, patchOntologyServer } from '@/lib/trellis/ontology-server';
import type { TypeUpdate } from '@/lib/trellis/use-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string[] }> };

function decodeOntologyId(segments: string[]): string {
  const joined = segments.join('/');
  try {
    return decodeURIComponent(joined);
  } catch {
    return joined;
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id: segments } = await context.params;
  const decodedId = decodeOntologyId(segments);
  const parsed = await parseJsonBody(request);
  if (!parsed.ok) return parsed.response;
  const updates = parsed.body as TypeUpdate;

  try {
    const ontology = await patchOntologyServer(decodedId, updates);
    return Response.json(ontology);
  } catch (err) {
    if (err instanceof OntologyNotFoundError) {
      return Response.json({ error: err.message }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : 'Failed to update ontology';
    return Response.json({ error: message }, { status: 500 });
  }
}
