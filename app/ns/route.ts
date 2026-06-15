import {
  LD_JSON_HEADERS,
  buildNamespaceContextDocument,
} from '@/lib/json-ld/context';

export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json(buildNamespaceContextDocument(), {
    headers: LD_JSON_HEADERS,
  });
}
