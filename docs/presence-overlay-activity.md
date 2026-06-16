# Presence: overlay activity chips

**Status:** backlog  
**Parent epic:** TRL-5 (playground backlog)  
**Tracking issue:** create with command below → expect `TRL-45` (close stray `TRL-44` *test issue* if still open)

```bash
cd fractal-playground
trellis issue create \
  -t "Presence: overlay activity chips — hide cursor in dialogs/sheets" \
  -P medium \
  -l presence,ui,realtime,backlog \
  --parent TRL-5 \
  --desc "When a peer opens configure sheet, record dialog, or other overlay, hide the misleading viewport cursor and show a compact activity chip with declared intent." \
  --ac "Local user pushes OFFSCREEN + overlay when configure sheet or record dialog opens" \
  --ac "PresenceCursors skips peers with overlay (or cell focus)" \
  --ac "PresenceActivityChips dock: avatar + human label, stacked bottom-right" \
  --ac "Closing overlay clears overlay state; pointer tracking resumes"
```

## Problem

Remote cursors are **viewport-normalized** and render globally (`PresenceCursors` in `AppShell`). When a peer opens an overlay (configure sheet, record dialog, etc.), their pointer often still tracks over the **blurred main surface** behind the modal. That reads as “they’re pointing at row 3” when they’re actually editing schema or a record — misleading spatial presence.

Observed case: peer on `?configure=general` while collaborator still sees their cursor floating over the collection table.

## Decision

**Hide pointer + show activity chip** (hybrid — not cursor-only, not badge-only).

| Peer state | Pointer | Remote sees |
|------------|---------|-------------|
| Browsing / pointing | Live cursor | `PresenceCursors` |
| Cell selected / typing | Hidden (`OFFSCREEN`) | Cell ring + caret + `RemoteCellNameBadges` *(shipped)* |
| Overlay / dialog / sheet | Hidden (`OFFSCREEN`) | **`PresenceActivityChips`** *(this issue)* |

Rationale:

- **Disappear-only** is honest but too quiet — configuring schema is high-signal.
- **Morph cursor → badge at last position** keeps a meaningless table coordinate.
- **Declared intent** matches cell-focus pattern already in the playground.

## State model

Extend `BoardPresence` (`lib/presence/types.ts`):

```ts
overlay?: string | null;       // machine id: "configure:general" | "record:new" | "record:edit"
overlayLabel?: string | null;  // human: "Configure collection · General"
```

Push on **page-scoped** presence (same room as cursors) when local UI opens/closes overlay:

```ts
// open
pushPresence({
  x: OFFSCREEN,
  y: OFFSCREEN,
  overlay: 'configure:general',
  overlayLabel: 'Configure collection · General',
});

// close
pushPresence({ overlay: null, overlayLabel: null });
```

Optional: mirror `overlay` on nav lobby (`__nav__` room) for header avatar tooltips — not required for v1.

**Do not** infer overlay-only from pointer position. Sender must explicitly set state (same rule as cell focus).

## Overlay taxonomy (v1)

| Surface | `overlay` | `overlayLabel` example |
|---------|-----------|-------------------------|
| `?configure=general` | `configure:general` | Configure collection · General |
| `?configure=schema` | `configure:schema` | Configure collection · Schema |
| `?configure=form` | `configure:form` | Configure collection · Form |
| `?configure=views` | `configure:views` | Configure collection · Views |
| New record dialog/sheet | `record:new` | New record |
| Edit record dialog/sheet | `record:edit` | Editing record |
| Settings (future) | `settings` | Settings |

URL-backed overlays can derive machine id from `searchParams`; modal-only shells set state in open/close handlers.

Note: `PresenceLinkBadge` intentionally **ignores** transient query params like `?configure` so sidebar badges stay on the page — activity chips are the right place to surface overlay context.

## UI: activity dock

New component: `components/presence/presence-activity-chips.tsx`

- Fixed dock, default **bottom-right** of viewport (`fixed bottom-4 right-4 z-50`)
- Stack vertically when multiple peers in overlays
- Each chip: peer color + avatar initial + truncated `overlayLabel`
- Tooltip: full name + route + overlay
- **v2:** chip click deep-links peer context (`?configure=general`) — out of scope for v1

Position note: bottom-right may overlap “Add record” / local chrome. Reserve padding or move dock to bottom-left of main pane if crowded.

## Implementation phases

### Phase 1 — Hide lying cursor (small)

- [ ] `collection-configure-sheet.tsx` / `collection-records-projection.tsx` — push overlay + `OFFSCREEN` on open; clear on close
- [ ] `RecordFormDialog` / `RecordFormSheet` / `RecordFormWizard` shells — same hooks via shared helper
- [ ] `presence-cursors.tsx` — filter `peer.state.overlay`
- [ ] Helper: `lib/presence/overlay-presence.ts` (`parseOverlayFromSearchParams`, `pushOverlayPresence`)

### Phase 2 — Activity chips

- [ ] `PresenceActivityChips` in `AppShell` next to `PresenceCursors`
- [ ] Labels from `overlayLabel` (fallback: parse `overlay` slug)

### Phase 3 — Polish (optional)

- [ ] Header avatar tooltip shows overlay when set
- [ ] Deep-link on chip click
- [ ] Activity strip under header instead of corner dock

## Files (expected touch)

| Area | Path |
|------|------|
| Types | `lib/presence/types.ts` |
| Push helpers | `lib/presence/use-joined-room.ts`, new `lib/presence/overlay-presence.ts` |
| Cursor filter | `components/presence/presence-cursors.tsx` |
| Activity UI | `components/presence/presence-activity-chips.tsx` |
| Mount | `components/shell/AppShell.tsx` |
| Configure | `components/collections/collection-configure-sheet.tsx`, `collection-records-projection.tsx` |
| Record forms | `components/forms/shells/record-form-*.tsx` |

## Related (shipped)

- Viewport-wide cursors (`use-pointer-presence.ts`, `AppShell` overlay)
- Cell focus hides pointer + bottom-left name badges
- Session-wide room count (`sessionPresence` / nav lobby)
- `PresenceLinkBadge` on sidebar links (page peers, ignores `?configure`)
- Cell text CRDT de-dupe on re-focus (`use-cell-text-sync.ts`)

## References

- Universal-presence demo: `trellis-node/examples/universal-presence/`
- Relay local dev: `fractal-playground/justfile` → `just presence-relay`
