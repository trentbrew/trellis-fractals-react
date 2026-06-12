# playground-next

React/Next.js port of the fractal projection contract — collections, browse projections, and playground demos on Trellis typed SDK.

## Quick start (local)

```bash
pnpm install
# Terminal A — Trellis sidecar (or reuse fractals-playground dev:db on :8230)
trellis db serve --port 8230
# Terminal B
pnpm dev
pnpm seed    # ontology + projection fixtures + collections (idempotent)
```

Open [http://localhost:3000/projections/kanban](http://localhost:3000/projections/kanban).

HTTP routes through `/api/trellis/*` in **local dev only** (sidecar has no CORS). **Hosted on Vercel:** browser calls the room node directly — deploy bundle must include CORS (use `TRELLIS_NODE_ROOT` when running `smoke:deploy`).

## Embed mode (brew.build)

Add `?embed=1` to hide shell chrome. Add `?readonly=1` to disable writes (brew.build iframe):

```
/projections/kanban?embed=1&readonly=1
/projections/kanban?embed=1
```

`next.config.ts` sets `frame-ancestors` for `brew.build` embeds.

## Hosted demo (kernel path)

Same two-tier model as [fractals-playground](../fractals-playground): **Sprites room node** (API) + **Vercel** (Next app).

You can **reuse** an existing sprite (e.g. `fractals-demo-0610`) or deploy a dedicated one:

```bash
pnpm run smoke:deploy -- playground-next-demo
pnpm run seed
pnpm run smoke:ws
```

### Vercel env (before `pnpm build` / deploy)

| Variable | Purpose |
| -------- | ------- |
| `TRELLIS_URL` | Rewrite target for `/api/trellis` (room node URL) |
| `NEXT_PUBLIC_TRELLIS_URL` | WebSocket origin (usually same as above) |
| `NEXT_PUBLIC_TRELLIS_API_KEY` | From `.trellis-db.json` after deploy |

Example embed URL once hosted:

```
https://playground.trellis.computer/projections/kanban?embed=1
```

**Domain:** `playground.trellis.computer` (Vercel, turtle-labs team). Avoid `cloud.trellis.computer` — reserved for Trellis Cloud control plane; `studio.trellis.computer` is Trellis Studio.

> The `*.sprites.app` URL is **API only** — not the Next UI. Blank “Trellis DB Inspector” at `/` on the sprite is expected.

## Room isolation

| Tier | Status |
| ---- | ------ |
| `?embed=1&readonly=1` | **Shipped** — brew.build iframe; shared showcase |
| Session room (`embed-{uuid}`) | **Shipped** — hosted app; private graph per browser session |
| `trellis deploy --name` per project | Product (C0) |

## Scripts

| Script | Description |
| ------ | ----------- |
| `pnpm seed` | Ontology + fixtures + collections |
| `pnpm run smoke:deploy -- <name>` | Deploy room node via trellis-node |
| `pnpm run smoke:ws` | WebSocket subscribe smoke |
| `pnpm test:e2e` | Playwright (collections + projections) |

## Architecture notes

- `lib/trellis/provider.tsx` — shared `TrellisDb`, HTTP patched to same-origin proxy, WS on public URL
- `components/shell/AppShell.tsx` — embed mode strips chrome
- Seed scripts read `url` + `apiKey` from `.trellis-db.json` when `TRELLIS_URL` is unset

Sibling: [fractals-playground](../fractals-playground) (Vite/Svelte, static `dist/` host).
