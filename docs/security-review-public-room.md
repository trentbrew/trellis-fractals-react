# Security review — playground as a public room

**Scope:** the fractal-playground Next app deployed at `playground.trellis.computer`, treated as a public sandbox any anonymous visitor can open and use realtime sync in.
**Date:** 2026-06-15
**Reviewer:** Claude (defensive pass, repo-only — the upstream Trellis room node was not inspected; items marked _(verify server-side)_ can only be confirmed there.)

---

## Threat model

- **Actor:** anonymous internet visitor, possibly running a custom client (not just the shipped JS).
- **Assets:** (1) the host/serverless infra, (2) other visitors' room data, (3) availability, (4) the shared demo/schema content.
- **Trust boundary:** the browser is fully untrusted. Everything the client asserts — `tenantId`, `room`, presence state, API key — is attacker-controlled. The only real boundary is what the **Trellis node** and the **Next API routes** enforce.

## Architecture in one paragraph

The client holds a **public** API key (`NEXT_PUBLIC_TRELLIS_API_KEY`, bundled into the JS) and talks to the room node for entity CRUD + realtime (WS `?apiKey=`). Tenant isolation is **client-asserted**: `lib/trellis/tenant-transport.ts` appends `?tenantId=` to every HTTP call and every WS `subscribe`. `?room=slug` → tenant `embed-<slug>` (shared, writable, URL-shareable); no room → random-UUID tenant (isolated by unguessability); passive/readonly embeds → default showcase tenant. **Ontologies (types/schema) are global**, not tenant-scoped, and are edited through Next App-Router routes that run with the **server** key.

---

## Findings

| # | Severity | Issue |
|---|----------|-------|
| H1 | **High** | Unauthenticated, server-credentialed mutation of the **global** schema via the ontology API routes |
| H2 | **High** _(verify server-side)_ | Public API key + client-asserted `tenantId` → isolation depends entirely on the node enforcing per-tenant, least-privilege authz |
| M1 | Medium | `/api/trellis/*` rewrite is an open same-origin proxy to the room node |
| M2 | Medium | No request body-size limit; no client-visible quota/rate limit on entity creation |
| M3 | Medium | Presence relay has no auth / server-side rate limiting (flood + spoof) |
| L1 | Low | CSP only sets `frame-ancestors` (no `default-src`/`script-src` defense-in-depth) |
| L2 | Info | `.trellis-deploy-gateway/gateway.js` is a separate bundled artifact needing its own review |

---

### H1 — Unauthenticated global-schema mutation (highest in-repo risk)

`POST /api/trellis/ontologies` ([route](../app/api/trellis/ontologies/route.ts)) and `PATCH /api/trellis/ontologies/[...id]` ([route](../app/api/trellis/ontologies/[...id]/route.ts)) →
[`lib/trellis/ontology-server.ts`](../lib/trellis/ontology-server.ts):

- Run with the **server** key from `trellisServerConfig()` (`TRELLIS_API_KEY`), independent of the caller.
- Have **no authentication/authorization** on the Next route — any anonymous request reaches them.
- Mutate the **global ontology** (types are shared across *all* rooms/tenants) and **write a server file** (`writeOntologyOverlay` → `<dbPath>/ontology-overlays.json`).
- The shipped app legitimately uses these routes for collection/type editing in **dev and prod** (`lib/trellis/use-types.ts` posts to `/api/trellis/ontologies`), so they can't simply be deleted.

**Impact:** one visitor can rewrite/replace type definitions for every other visitor (persistent schema poisoning that breaks collections globally); arbitrary `@id` keys grow the overlay file unbounded; on Vercel the overlay write hits a read-only FS and 500s, but the upstream sidecar POST/PATCH still applies the global schema change.

**Recommendations:**
1. Make ontologies **tenant-scoped** server-side so each room owns its schema (correct long-term fix; aligns with the per-tenant model already used for entities).
2. Until then, gate writes in the public deployment — require a server-side token the public client doesn't carry, or set the public deployment to **read-only schema** (visitors can create records but not redefine global types).
3. Guard `writeOntologyOverlay` for read-only/serverless filesystems (write to `/tmp` or skip) so it degrades instead of 500-ing.
4. Cap and validate `@id` and field counts before persisting.

### H2 — Public key + client-asserted tenant _(verify on the node)_

`NEXT_PUBLIC_TRELLIS_API_KEY` is in the client bundle (`lib/trellis/provider.tsx`) and sent as `Authorization: Bearer` / WS `?apiKey=`. The client chooses its own `tenantId` and `room`. So **all** isolation depends on the node:

- Does the public key authorize only **entity CRUD scoped to the asserted tenant**, or can it read/write **any** tenant and run admin ops (delete tenant, bulk export, ontology writes)?
- Are random-UUID room tenants the *only* thing protecting a "private" sandbox? (They are unguessable, but the room id is auto-written into the visible URL by `resolveAndSyncSessionRoom`, so anyone the URL is shared with gets full read/write — there's no per-user auth.)

**Must confirm before calling it solid:** the public key is least-privilege — entity CRUD only, no cross-tenant reads, no destructive/admin verbs, no ontology mutation. Named rooms (`?room=fractals-blog`) being world-writable is acceptable *by design* for a sandbox; silent cross-tenant access is not.

### M1 — Open same-origin proxy

`next.config.ts` rewrites `/api/trellis/:path((?!ontologies).*)` → `${trellisOrigin}/:path*`. It relays the caller's headers (no server-cred injection) to a **fixed** origin (not arbitrary SSRF), but it turns the playground origin into a proxy for the node and is reachable even though the provider only uses the proxy in local dev (prod client uses direct CORS). **Recommendation:** confirm the rewrite is needed in prod; if not, drop it or restrict it (it mainly gives attackers a way to launder requests through the playground origin / dodge naive IP allowlists on the node).

### M2 — No body-size limit / unbounded writes

`lib/trellis/parse-json-body.ts` reads `request.text()` with no size cap (Vercel's ~4.5 MB function limit is the only ceiling). Any visitor in a writable room can also create unlimited entities. **Recommendation:** cap request body size in `parseJsonBody`; enforce per-tenant entity quotas + write rate limiting on the node.

### M3 — Presence relay abuse

The `/rt` relay (hosted) / BroadcastChannel (local) carries presence keyed by room. A custom client can join any room's presence, **flood** updates (the 33 ms throttle in `use-pointer-presence.ts` is client-side only), and **spoof** `name`/`color`/`route`. No XSS — names/routes are rendered as text and `color` only feeds inline `style` (React won't execute it). Risk is availability + cosmetic spoofing. **Recommendation:** per-connection rate limiting and presence-payload caps on the relay.

### L1 — CSP is frame-ancestors only

`next.config.ts headers()` sets a good `frame-ancestors` allowlist (clickjacking protection) but no `default-src`/`script-src`. No XSS sink exists today, so this is defense-in-depth. **Recommendation:** add a baseline `default-src 'self'` + explicit `connect-src` (node + relay origins); the inline theme script in `app/layout.tsx` will need a nonce or hash.

### L2 — Deploy gateway

`.trellis-deploy-gateway/gateway.js` is a bundled `@bun` artifact, not imported by the Next build. It is its own runtime surface (deploy/relay) and deserves a separate review; not covered here.

---

## What's already solid ✅

- **No stored-XSS sink for user content** — rich text is shown via `htmlToPlainText` in card/list views; the only `dangerouslySetInnerHTML` is a static, server-authored theme bootstrap script in `app/layout.tsx`.
- **Room slug is strictly validated** (`/^[a-zA-Z0-9_-]+$/`, ≤64) in `lib/shell/session-room.ts`.
- **Casual visitors are isolated by default** — no `?room` → random-UUID tenant per browser.
- **Clickjacking controlled** via the `frame-ancestors` allowlist.
- **Presence identity is auto-generated** (anon "Adjective Animal") and text-rendered — no user-supplied display names to escape.

---

## Mitigations applied in this pass (in-repo)

These landed in the repo on 2026-06-15; they harden the Next surface but do **not** substitute for the server-side items (H1 tenant-scoping, H2 key scope, relay limits):

- **M2 — body-size cap:** `parseJsonBody` now rejects payloads >256 KB (checks `Content-Length` and actual length → `413`). [`lib/trellis/parse-json-body.ts`](../lib/trellis/parse-json-body.ts)
- **H1 (partial) — serverless-safe overlay write:** `writeOntologyOverlay` tolerates read-only FS (`EROFS`/`EACCES`/`EPERM`) and returns `false` instead of 500-ing; the upstream node stays authoritative. [`lib/trellis/ontology-overlay.ts`](../lib/trellis/ontology-overlay.ts)
- **M1 — proxy gated to dev:** the `/api/trellis/*` rewrite is only emitted when the trellis origin is localhost; in prod (direct CORS) it's gone. [`next.config.ts`](../next.config.ts)
- **L1 (partial) — hardening headers:** added `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` to CSP (kept `frame-ancestors`; **no** `X-Frame-Options`, which would break the brew.build embeds), plus `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and a `Permissions-Policy` disabling camera/mic/geolocation/topics. [`next.config.ts`](../next.config.ts)

Still **server-side** (the real isolation guarantees) — see checklist below.

## Pre-launch checklist

- [ ] **H2 (server):** Confirm on the node that `NEXT_PUBLIC_TRELLIS_API_KEY` is least-privilege (entity CRUD within asserted tenant; no admin/cross-tenant/ontology).
- [ ] **H1 (server):** Tenant-scope ontologies *or* make schema read-only / token-gated in prod. ✅ overlay write is now serverless-safe (in-repo).
- [ ] **M2/M3 (server):** Per-tenant write quotas + relay rate limiting on the node. ✅ request body-size cap done (in-repo).
- [x] **M1:** `/api/trellis/*` rewrite gated to local dev (in-repo).
- [ ] Confirm `TRELLIS_API_KEY` (server) ≠ a more-privileged key than intended; rotate both before going public.
- [ ] **L1 (follow-up):** Tighten CSP with `script-src`/`connect-src` + a nonce for the theme script. ✅ `object-src`/`base-uri`/`form-action` + nosniff/Referrer/Permissions-Policy done (in-repo).
- [ ] Decide the data-retention/abuse story for world-writable named rooms (e.g. periodic reset of demo rooms like `fractals-blog`).
