# Fractals blog — working notes

> **REMINDER:** Reference this talk in the fractals / vantage blog post.  
> **Video:** [Climbing the ladder of abstraction (Adept)](https://www.youtube.com/watch?v=PAy_GHUAICw)

---

## Why cite it

The Adept talk frames the same product thesis as **Fractal Responsiveness** / the `/fractals` rail:

| Their framing | Our framing |
|---------------|-------------|
| Ladder of abstraction | Vantage (1–13) |
| Google Maps zoom hides irrelevant detail | Projection collapse (graph → table → list → grid) |
| Same object, many representations | Same `Card` entity, many shells |
| AI generates levels + glues transitions | Trellis graph + projection contract (local-first, not chatbot) |
| Augmentation = stacked automations | CRUD at high vantage; read/compare at low |
| “Not arguing higher is better — easy to move between levels” | Slider + presets; entity → collection → page → app |

Brett Victor nod: talk title deliberately echoes [Up and Down the Ladder of Abstraction](http://worrydream.com/LadderOfAbstraction/) — worth a secondary cite if we go deep on lineage.

---

## Pull quotes (from transcript)

**Spreadsheets / stacked automation**

> “Augmentation is composed of smaller automations… each cell [is] automated away and no one really thinks of spreadsheets as taking people's jobs.”

**Maps / zoom**

> “The exact same object can be represented at many different levels of detail… at these more zoomed out levels Google Maps actually starts hiding information.”

> “If we try to keep all of that information at higher zoom levels it would be completely incomprehensible.”

**Core thesis**

> “We can use AI to generate these different levels, glue them together, and make it easy to move between them.”

> “I'm not trying to argue that higher levels are better — instead… make it easy to move between them.”

**Peter Pan / bidirectional edit (parallel to fractal edit)**

> “Viewing the text at this highest zoom level, editing it and then zooming back in to see how that changed the raw text would be a much nicer workflow.”

**Airbnb demo (collection + entity)**

- Detail page → elevated “deciding factors” view (entity zoom)
- 50 listings table (collection zoom)
- Scatter plot cluster + bulk action (galaxy / graph zoom)

---

## Suggested blog structure (draft)

1. **Problem** — interfaces are single-scale; we mentally abstract in our heads (50 Airbnb tabs).
2. **Prior art** — spreadsheet (VisiCalc), maps (Google Maps), Adept ladder talk (link video).
3. **Fractal Responsiveness** — `--vantage`, projection collapse, four containment demos.
4. **Live proof** — `playground.trellis.computer/fractals/collection` (or `/grid` until route migrates).
5. **Contrast with chatbots** — “technology embedded in interfaces where we're still driving” (quote from talk).
6. **Trellis angle** — semantic graph owns identity across projections; server accelerates, never owns.

---

## Links to ship in post

- Talk: https://www.youtube.com/watch?v=PAy_GHUAICw
- Playground hub: https://playground.trellis.computer/fractals
- Collection demo: https://playground.trellis.computer/fractals/collection
- Entity demo: https://playground.trellis.computer/fractals/entity
- Kanban + multiplayer: https://playground.trellis.computer/projections/kanban?embed=1
- Brett Victor ladder (optional): http://worrydream.com/LadderOfAbstraction/

---

## Shipped (2026-06-12)

- Primary nav **Fractals** → `/fractals`
- Secondary: Entity · Collection · Page · App
- **Entity** (`/fractals/entity`) — dot → chip → row → card → panel → page
- **Collection** (`/fractals/collection`) — graph / table / list / grid projection collapse
- **Page / App** — stubs (honest in post: “sketch” or prose-only until fleshed out)
- `/grid` → 307 → `/fractals/collection`

---

## Blog strategy: draft now, publish when embeds land

**Recommendation: write the first draft now.** Don't block on Page/App demos.

| Asset | Status | Post role |
|-------|--------|-----------|
| Argument + lineage (maps, spreadsheets, Adept) | Ready | Acts 1–2 — no code dependency |
| Entity demo | Shipped | Embed #1 — single-record ladder |
| Collection demo | Shipped | Embed #2 — projection collapse |
| Kanban + presence | Shipped | Embed #3 — live graph + cursors + inline edit |
| Page demo | Stub | Prose + optional static screenshot; label “in progress” |
| App meta collapse | Vision | One paragraph + rail diagram; not an embed yet |

**Why draft first:** Writing forces the thesis to stand without demo polish. Page/App are act 4; Collection + Entity + Kanban are enough to publish a credible v1 post.

**Placeholder convention in draft:**

```markdown
<!-- EMBED: /fractals/entity?embed=1 — vantage 1 vs 12 -->
<!-- EMBED: /fractals/collection?embed=1 — sweep graph→grid -->
<!-- EMBED: /projections/kanban?embed=1 — open two tabs, show cursors -->
```

**MVP publish bar (3 live embeds):** entity · collection · kanban multiplayer.

**Embed work before publish (engineering):**
- [x] `?embed=1` for `/fractals/entity` and `/fractals/collection` (AppShell embed chrome)
- [x] `embedKickerForPath` fractals kickers
- [x] `?vantage=` deep-link via `useVantageState`

---

## TODO before publish

- [x] First draft → [`fractals-blog-draft.md`](fractals-blog-draft.md)
- [x] Wire fractals embed routes on playground
- [x] Embed cookbook → [`fractals-blog-embeds.md`](fractals-blog-embeds.md)
- [x] QA gallery → `/fractals/embeds`
- [x] Ladder reference visual → `/fractals/ladder?embed=1`
- [x] Page/App stubs embed-friendly
- [ ] Paste iframes into brew.build
- [ ] Redeploy sprites + Vercel
- [ ] Smoke `/fractals/embeds` on production
