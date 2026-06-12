import { listOntologiesServer, proxyCreateOntology } from '@/lib/trellis/ontology-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const ontologies = await listOntologiesServer();
  return Response.json(ontologies);
}

export async function POST(request: Request) {
  const body = await request.json();
  return proxyCreateOntology(body);
}
