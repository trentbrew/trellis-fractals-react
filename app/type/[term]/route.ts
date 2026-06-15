import { LD_JSON_HEADERS, buildTypeTermDocument } from '@/lib/json-ld/context';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ term: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { term } = await context.params;
  const document = buildTypeTermDocument(decodeURIComponent(term));
  if (!document) {
    return Response.json({ error: `Unknown vocabulary term: ${term}` }, { status: 404 });
  }

  return Response.json(document, { headers: LD_JSON_HEADERS });
}
