import { parseJsonBody } from '@/lib/trellis/parse-json-body';
import { signRoomToken } from '@/lib/trellis/sign-room-token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Matches the room-slug rules in lib/shell/session-room.ts. */
const ROOM_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;
/** Mirrors resolvePlaygroundTenantId: tenant = `embed-<room>`. */
const TENANT_PREFIX = 'embed-';
const TOKEN_TTL_SECONDS = 60 * 60; // 1h; client refreshes

/**
 * Mint an anonymous, tenant-scoped JWT for the current room (see H2 in
 * docs/security-review-public-room.md). Replaces shipping the static admin key
 * to the browser. Open by design — minting a room token *is* joining a public
 * room — but the token is non-admin and pinned to exactly one tenant.
 */
export async function POST(request: Request) {
  const secret = process.env.TRELLIS_JWT_SECRET?.trim();
  if (!secret) {
    // Loud misconfig: never silently issue tokens the node can't verify.
    return Response.json(
      { error: 'Room tokens unavailable (TRELLIS_JWT_SECRET not configured)' },
      { status: 501 },
    );
  }

  const parsed = await parseJsonBody(request, 4 * 1024);
  if (!parsed.ok) return parsed.response;

  const room = (parsed.body as { room?: unknown }).room;
  if (typeof room !== 'string' || !ROOM_PATTERN.test(room)) {
    return Response.json({ error: 'Invalid room slug' }, { status: 400 });
  }

  const tenantId = `${TENANT_PREFIX}${room}`;
  const { token, expiresAt } = await signRoomToken({
    secret,
    tenantId,
    ttlSeconds: TOKEN_TTL_SECONDS,
    roles: [], // never admin in a browser token
  });

  return Response.json({ token, tenantId, expiresAt });
}
