type ParseJsonBodyResult =
  | { ok: true; body: unknown }
  | { ok: false; response: Response };

/** Default cap for ontology/schema JSON payloads — generous for real defs, hostile to abuse. */
const DEFAULT_MAX_BYTES = 256 * 1024; // 256 KB

export async function parseJsonBody(
  request: Request,
  maxBytes: number = DEFAULT_MAX_BYTES,
): Promise<ParseJsonBodyResult> {
  // Reject oversized payloads up front when the client declares a length.
  const declared = Number(request.headers.get('content-length') ?? '');
  if (Number.isFinite(declared) && declared > maxBytes) {
    return {
      ok: false,
      response: Response.json({ error: 'Request body too large' }, { status: 413 }),
    };
  }

  const text = await request.text();

  // Re-check actual size — content-length can be absent (chunked) or lie.
  if (text.length > maxBytes) {
    return {
      ok: false,
      response: Response.json({ error: 'Request body too large' }, { status: 413 }),
    };
  }

  if (!text.trim()) {
    return {
      ok: false,
      response: Response.json({ error: 'Request body required' }, { status: 400 }),
    };
  }

  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return {
      ok: false,
      response: Response.json({ error: 'Invalid JSON body' }, { status: 400 }),
    };
  }
}
