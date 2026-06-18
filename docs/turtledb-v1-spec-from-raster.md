# TurtleDB v1 — spec derived from Raster's InstantDB usage

> **Premise:** Raster (`app.raster.tv/client-nuxt`) is a live product with real users running on
> InstantDB `@0.22.96` (`@instantdb/core` client + `@instantdb/admin` server). It uses Instant only
> because the realtime Trellis SDK didn't exist yet. Raster's *actual* InstantDB surface is therefore
> the real-world requirements spec for TurtleDB v1 — not a wishlist. This doc inventories that surface
> and maps each piece to the Trellis parity bar.

Audited: 2026-06-17. ~42 files / ~210 references touch Instant, concentrated behind a handful of
composables and server utils (good — the data layer is already abstracted).

---

## 1. The data model (what TurtleDB must store)

`instant.schema.ts` declares **24 app entities + 2 system (`$users`, `$files`), 30 links, 1 presence room.**

- Attribute types in use: `i.string() / number() / boolean() / json() / any()`
- Modifiers: `.optional() .unique() .indexed()`
- Links: forward/reverse with `has: 'one' | 'many'`, named labels, `onDelete: 'cascade'`
- Domains: orgs → apps → collections; stations → members/schedule/social/viewership; chat; settings (KV).

**Maps to Trellis:** EAV kernel already covers this natively. Links = edges. The only ergonomic gap is
a *typed schema-definition DSL* equivalent to `i.schema()` so app authors get types + indexes.

### Smell that's actually an opportunity
`settings` is used as a generic JSON bag — `customTypes`, `workflows`, `projections`, and per-collection
`schema` are all crammed into `settings.value` (a `json`/`any` column) keyed by `settingKey`. That's an
EAV escape hatch *inside* a relational store. On TurtleDB these become **first-class graph entities**,
not opaque blobs. Good "the graph is just better" demo.

---

## 2. Reads — the query surface (smaller than you'd fear)

| API | Count | Shape |
|---|---|---|
| `db.subscribeQuery(q, cb) → unsub` | 10 | reactive live query; `{ data, error }` |
| `db.queryOnce(q) → { data }` | 57 | one-shot, mostly read-modify-write upserts |
| `db.query(...)` (admin, server) | 24 | server one-shot |

**InstaQL operators actually used:** namespace nesting + `$: { where, limit }`, equality, and range
(`$gt $lt $gte $lte`). **No `$in / $or / $and / order / deep link-traversal in queries` appear in app
code.** The query language Raster depends on is *small* — equality + range + limit. That's an
achievable EQL-S parity target.

**Parity bar:**
- `subscribeQuery(query, cb)` ergonomics returning an unsubscribe fn — match this exact signature.
- `queryOnce(query)` one-shot.
- Where = equality + range; `limit`. (Defer `$in/$or/order` until a real consumer needs them.)
- Requires the **optimistic local cache + reactive live-query** work already on Trellis's "still needed" list.

---

## 3. Writes — transactions

| API | Count |
|---|---|
| `db.transact([...ops])` | 83 client + 25 server |
| `tx.<ns>[id].update(data)` | 66 (also used as create/upsert) |
| `tx.<ns>[id].create(data)` | 29 |
| `tx.<ns>[id].delete()` | 45 |
| `tx.<ns>[id].link({label: id})` | 25 |
| `.merge()` / `.unlink()` | 0 / 0 |

- IDs are **client-generated** (`crypto.randomUUID()`); Instant's own `id()` used only 3×.
- Upsert = `queryOnce` then `update` by found id (see `upsertUserSetting`).

**Parity bar:** a transaction builder — `transact([tx.ns[id].update|create|delete|link(...)])` — over
content-addressed ops. Trellis ops map cleanly; need the `tx` proxy DSL + `link` by label. `merge`/`unlink`
not required for v1.

---

## 4. Auth — the biggest genuinely-new surface (decouple it)

| API | Count | Notes |
|---|---|---|
| `db.getAuth()` | 15 | current user |
| `db.auth.signInWithIdToken({ idToken })` | 3 | **Google OAuth ID-token exchange** |
| `db.auth.signOut()` | 11 | |
| `admin.auth.verifyToken(token)` | 6 | **server-side JWT verification** |
| `admin.auth.getUser(...)` | 1 | |

Instant provides **hosted auth**: OAuth ID-token → Instant-issued JWT → server `verifyToken`. Trellis
has only "basic permissions/auth" today. This is the hardest parity piece and it's **isolated** in
`useInstantAuth.ts` + `server/utils/instant-admin.ts`.

**Recommendation: decouple auth from the data migration.** Move the *data layer* to TurtleDB first; keep
Instant (or a dedicated auth provider) issuing identity/JWT until Trellis has an OAuth-exchange +
verifiable-JWT story. Don't block the data win on the auth surface.

---

## 5. Storage — trivial

`db.storage.uploadFile(path, file)` ×2, `db.storage.getDownloadUrl(path)` ×2, `$files` system entity.
Trellis already has a blob store. Low bar; thin adapter.

---

## 6. Presence / rooms — **THE WEDGE (Trellis already wins)**

Schema declares `rooms.viewers` presence — **but Raster can't use it.** `useViewerPresence.ts` header:

> *"InstantDB's presence API (rooms) requires the React SDK. For Vue/Nuxt, we use a simpler approach
> based on recent chat activity… TODO: custom websocket solution for true real-time presence."*

So today "concurrent viewers" is faked as *unique chat authors in the last 5 minutes*. The declared
presence room is dead weight.

**This is the migration's first, most visible win.** Trellis presence (`joinPresence` / `/rt`) is
framework-agnostic — it works in Vue. Replacing the chat-proxy hack with real presence is something
Instant *structurally cannot do* on Raster's stack. Lead the migration here: immediate new capability,
not just parity.

---

## 7. Permissions

`instant.perms.ts`: CEL-style `bind` + `allow {view,create,delete,update}` rules using `auth.id`,
`data.ownerId`, and link-ref rules (`auth.ref('$user.stationMemberships.role')`,
`data.ref('station.ownerId')`). Owner-based writes, role-via-link reads, documented multi-tenant
correlation limits. Maps to Trellis's **permission-aware live-query filtering** (already on the
"still needed" list).

---

## 8. v1 scope & sequencing

**Parity bar for TurtleDB v1 (in priority order):**

1. **Typed schema DSL** (`i.schema`-equivalent) over EAV — entities, links, indexes. *(have kernel; need DSL)*
2. **Reactive `subscribeQuery(q,cb)→unsub` + optimistic local cache.** *(core gap; on Trellis roadmap)*
3. **`transact([tx.ns[id].update/create/delete/link])` builder** over content-addressed ops.
4. **`queryOnce`** one-shot + where(equality/range)+limit.
5. **Presence** parity (already ahead — ship first as the demo).
6. **Permission-aware live-query filtering** (owner + role-ref).
7. **Storage** adapter (uploadFile / getDownloadUrl).
8. **Auth** — *deferred / decoupled*: keep external identity until OAuth-exchange + JWT exist.

**Migration plan for Raster (north star, not next sprint — it has real users):**
1. Inventory done (this doc). Data layer already sits behind ~5 composables (`useInstantData`,
   `useInstantAuth`, `useViewerPresence`, `useViewershipTracking`) + server utils → swap is contained.
2. Build TurtleDB SDK to items 1–5 above (framework-agnostic core + Vue + React bindings).
3. **Ship presence first** — replace the faked viewer count; visible win Instant can't match.
4. Shadow/dual-run the data layer behind a flag; migrate read paths, then writes.
5. Cut over data when parity proven. Move auth last, only when JWT story exists.

**Why this is on-telos:** every gap above is already on Trellis's "still needed" list. Raster doesn't
expand scope — it *prioritizes* it against a real workload, and the one place Trellis is already ahead
(presence) is the most visible user-facing win. TurtleDB becomes the bridge that makes Trellis the
substrate under your one commercially-bound product.
