# Fractal playground (Next.js) — local dev
# Local stack: `just run` (db :8230 + Next :3000), or `just db-serve` then `just dev`
# Projections lab: `just db-serve` then `just seed-projections` (fixtures are meaningless)
# Note: `trellis db *` subcommands need Bun (Node launcher exits silently).

set shell := ["bash", "-cu"]

default:
    @just --list

dev:
    pnpm dev

dev-webpack:
    pnpm dev:webpack

# After `rm -rf .next` mid-session or ENOENT build-manifest 500s — stop dev first, then:
dev-clean:
    rm -rf .next
    pnpm dev

# One-time: writes .trellis-db.json + .trellis-db/ (port 8230)
db-init:
    bunx trellis db init --port 8230

# Foreground Trellis DB HTTP + WebSocket server
db-serve:
    bunx trellis db serve -p 8230

# Presence relay for cross-browser cursors (BroadcastChannel handles same-browser tabs)
presence-relay port="8231":
    cd ../trellis-node && RELAY_PORT={{port}} node scripts/demo-relay.mjs

trellis-url := "http://localhost:8230"
app-url := "http://localhost:3000"

# Register explorer ontologies + seed demo collections (requires db-serve)
seed:
    node scripts/register-collection-ontology.mjs
    node scripts/seed-collections.mjs

# Projection lab fixtures — run after db-serve (meaningless entities for resolver stress)
seed-projections:
    node scripts/seed-projection-fixtures.mjs

# Full graph seed: collections + corpus projection fixtures (requires db-serve)
seed-all: seed seed-projections

# Deploy Trellis DB to Sprites (requires sprite CLI + auth). Sets .trellis-db.json remote fields.
deploy-db name port="8080":
    bunx trellis deploy --name {{name}} --port {{port}} --config-dir .

# Seed a remote DB — set TRELLIS_URL (and TRELLIS_API_KEY if mutations 401)
seed-remote:
    #!/usr/bin/env bash
    set -euo pipefail
    : "${TRELLIS_URL:?Set TRELLIS_URL=https://<name>.sprites.app}"
    node scripts/register-collection-ontology.mjs
    node scripts/seed-collections.mjs
    node scripts/seed-projection-fixtures.mjs

# JSON-LD vocabulary routes (requires Next dev on :3000)
smoke-ontology-vocab:
    node scripts/smoke-ontology-vocab.mjs

# Health + route smoke (parity pass)
parity:
    #!/usr/bin/env bash
    set -euo pipefail
    for path in /collections /collections/ideas /projections /projections/list /projections/table \
      /projections/kanban /projections/calendar /projections/gantt \
      /projections/dag /projections/json-ld /projections/gallery /grid /planets \
      "/collection?type=Task" "/collection?type=Card" "/collection?type=KanbanCard" \
      "/collection?type=CalendarEvent" "/collection?type=GanttTask"; do
      code=$(curl -sf -o /dev/null -w "%{http_code}" "{{ app-url }}${path}")
      echo "$code $path"
      test "$code" = "200"
    done
    for path in /todos /table /kanban /calendar /gantt; do
      code=$(curl -s -o /dev/null -w "%{http_code}" "{{ app-url }}${path}")
      echo "$code $path (legacy redirect)"
      test "$code" = "307" -o "$code" = "308"
    done
    curl -sf "{{ app-url }}/api/trellis/health" >/dev/null
    echo "parity: ok"

# Trellis DB + presence relay + Next dev (Bun for db-serve — see db-serve recipe)
run:
    #!/usr/bin/env bash
    set -euo pipefail
    trap 'kill $(jobs -p) 2>/dev/null; wait' INT TERM EXIT
    bunx trellis db serve -p 8230 &
    just presence-relay &
    pnpm dev &
    wait
