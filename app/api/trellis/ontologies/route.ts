import { parseJsonBody } from '@/lib/trellis/parse-json-body';
import { listOntologiesServer, proxyCreateOntology } from '@/lib/trellis/ontology-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const ontologies = await listOntologiesServer();
  return Response.json(ontologies);
}

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request);
  if (!parsed.ok) return parsed.response;
  return proxyCreateOntology(parsed.body);
}
