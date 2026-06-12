# Hosted demo — playground.trellis.computer

Canonical ops notes for the public fractal / live-graph demo. Narrative context lives in [brew.build SCRATCH.md](https://github.com/trentbrew/brew.build/blob/main/SCRATCH.md#demo-deploy-2026-06).

## Live surfaces

| Surface | URL |
| ------- | --- |
| Full app | https://playground.trellis.computer/projections/kanban |
| brew.build embed | https://playground.trellis.computer/projections/kanban?embed=1 |
| Vercel project | `turtle-labs/trellis-playground` |
| Room node | `*.sprites.app` from `pnpm run smoke:deploy` (API only — not the UI) |

## Embed CSP

`next.config.ts` sets `frame-ancestors` for:

- `https://brew.build`, `https://*.brew.build`
- `https://trellis.computer`, `https://*.trellis.computer`
- `http://localhost:4321`, `http://127.0.0.1:4321` (local brew.build)

## Vercel env

| Variable | Purpose |
| -------- | ------- |
| `NEXT_PUBLIC_TRELLIS_URL` | WebSocket + direct HTTP (hosted) |
| `NEXT_PUBLIC_TRELLIS_API_KEY` | Demo room key (public in bundle) |
| `TRELLIS_URL` | Unused for hosted HTTP (Vercel cannot proxy to `*.sprites.app`); kept for parity |

Local dev uses `/api/trellis` rewrite → `localhost:8230` (see `lib/trellis/provider.tsx`).

## Deploy checklist

```bash
pnpm run smoke:deploy -- fractals-demo-0610   # TRELLIS_NODE_ROOT → local trellis-node for CORS bundle
pnpm run seed
pnpm run smoke:ws
vercel deploy --prod
```

Exclude `.trellis/` from uploads (see `.vercelignore`).

## Room isolation

| Tier | Status |
| ---- | ------ |
| `?embed=1&readonly=1` | **Shipped** — shared showcase tenant (default) |
| Session room (`embed-{uuid}`) | **Shipped** — hosted writable app, per-tab private graph |
| TTL purge (24h) | Planned (sprite cron) |
| `trellis deploy --name` per project | Product (C0) |

Blog embed → **readonly** showcase on default tenant. Full app on `playground.trellis.computer` → **session tenant** (`embed-{uuid}` in `sessionStorage`), seeded with starter kanban cards. Cross-tab sync works within the same browser session.

## Subdomain map (reference)

| Host | Role |
| ---- | ---- |
| `playground.trellis.computer` | This demo |
| `studio.trellis.computer` | Trellis Studio (separate product) |
| `console.trellis.computer` | Cloud control plane (post-NLnet) |
| `{project}.trellis.computer` | Per-project room nodes (`trellis deploy`) |

Sibling: [fractals-playground](../fractals-playground) (Vite/Svelte static embed).
