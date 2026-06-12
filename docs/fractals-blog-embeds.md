# Fractals blog — embed cookbook

Production origin: **https://playground.trellis.computer**

QA gallery (local or hosted): [/fractals/embeds](https://playground.trellis.computer/fractals/embeds) — includes **Desktop / Tablet / Mobile** width preview toggles (gallery-only; published iframe specs unchanged).

**Local dev:** open `http://localhost:3000/fractals/embeds` — preview iframes and copy snippets use `localhost` automatically. Override with `NEXT_PUBLIC_PLAYGROUND_ORIGIN` if your dev server uses another port.

---

## MVP embeds (ship with v1 post)

| # | Caption | Path | Frame |
|---|---------|------|-------|
| 0 | Ladder overview (optional) | `/fractals/ladder?embed=1` | 1:1 |
| 1 | Entity — dot | `/fractals/entity?embed=1&vantage=1` | 1:1 |
| 2 | Entity — page | `/fractals/entity?embed=1&vantage=12` | 1:1 |
| 3 | Collection — dot field | `/fractals/collection?embed=1&vantage=1` | 1:1 |
| 4 | Collection — card grid | `/fractals/collection?embed=1&vantage=10` | 1:1 |
| 5 | Kanban — live graph | `/projections/kanban?embed=1&room=fractals-blog` | 1:1 |

All MVP embeds use a **square (1:1) aspect-ratio** wrapper with `overflow: hidden`; content scrolls inside the iframe. Collection/entity/page embeds pin the vantage dock to the **top**.

### iframe template

```html
<div style="position:relative;width:100%;aspect-ratio:1/1;overflow:hidden;border-radius:8px;border:1px solid #333;">
  <iframe
    src="https://playground.trellis.computer/fractals/entity?embed=1&vantage=1"
    title="Trellis Fractals — entity at vantage 1"
    style="position:absolute;inset:0;width:100%;height:100%;border:0;"
    loading="lazy"
    allow="clipboard-write"
  ></iframe>
</div>
```

Replace `src` per row above. Copy live snippets from [/fractals/embeds](https://playground.trellis.computer/fractals/embeds).

---

## Query params

| Param | Values | Effect |
|-------|--------|--------|
| `embed` | `1` | Strip app chrome; show kicker + demo only |
| `vantage` | `1`–`13` | Deep-link entity/collection presentation |
| `room` | slug | Shared writable session (kanban + hosted graph) |
| `readonly` | `1` | Disable mutations (not used in MVP embeds) |

---

## Kanban multiplayer note

Presence cursors work in the **same browser** (BroadcastChannel). Cross-browser needs the `/rt` relay on the sprites node (post-deploy).

For the blog: iframe is single-tab; caption should say *“Open the same URL in a second tab to see cursors.”*

Stable public demo room: `?room=fractals-blog`

---

## Optional stubs (prose-only in post — no MVP embed required)

| Demo | Embed URL | Notes |
|------|-----------|-------|
| Page sketch | `/fractals/page?embed=1` | Static layout mock |
| App sketch | `/fractals/app?embed=1` | Shell miniature mock |

---

## brew.build checklist

- [ ] Entity dot + page iframes
- [ ] Collection graph + grid iframes
- [ ] Kanban iframe with `room=fractals-blog`
- [ ] Optional ladder reference iframe near “Fractal Responsiveness” section
- [ ] Link hub: `https://playground.trellis.computer/fractals`
- [ ] Adept talk + Brett Victor links in references

---

## After deploy

1. Redeploy sprites node with `presenceRelay: true` (cross-browser cursors)
2. `pnpm build` + Vercel promote
3. Smoke: open [/fractals/embeds](https://playground.trellis.computer/fractals/embeds) and verify all six iframes load
