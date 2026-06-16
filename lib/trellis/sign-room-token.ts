/**
 * Mint an anonymous, tenant-scoped JWT for the room node — the browser's
 * replacement for the static admin API key (see docs/security-review-public-room.md, H2).
 *
 * Format mirrors the node's `auth.ts` HS256 verifier exactly (header
 * `{alg:'HS256',typ:'JWT'}`, base64url, claims `{iat,exp,sub,tenantId,roles}`),
 * so `verifyJwt` on the node accepts it. The signing secret MUST equal the
 * node's `jwtSecret`. Server-only — never import from client code.
 */

const encoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

export interface RoomToken {
  token: string;
  /** Epoch ms when the token expires. */
  expiresAt: number;
}

export async function signRoomToken(opts: {
  secret: string;
  tenantId: string;
  /** Default 1h. Keep short — the client refreshes. */
  ttlSeconds?: number;
  /** Default `[]` — never grant admin to a browser token. */
  roles?: string[];
}): Promise<RoomToken> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (opts.ttlSeconds ?? 3600);

  const header = { alg: 'HS256', typ: 'JWT' };
  const claims = {
    iat: now,
    exp,
    sub: 'anon',
    tenantId: opts.tenantId,
    roles: opts.roles ?? [],
  };

  const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(claims)));
  const signing = `${headerB64}.${payloadB64}`;

  const key = await hmacKey(opts.secret);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signing));
  const sigB64 = base64UrlEncode(new Uint8Array(sig));

  return { token: `${signing}.${sigB64}`, expiresAt: exp * 1000 };
}
