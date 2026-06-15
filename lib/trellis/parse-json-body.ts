type ParseJsonBodyResult =
  | { ok: true; body: unknown }
  | { ok: false; response: Response };

export async function parseJsonBody(request: Request): Promise<ParseJsonBodyResult> {
  const text = await request.text();
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
