# Fractal Responsiveness

*Draft for brew.build — embed specs in [`fractals-blog-embeds.md`](fractals-blog-embeds.md). QA: [playground.trellis.computer/fractals/embeds](https://playground.trellis.computer/fractals/embeds)*

---

When I open fifty Airbnb tabs to pick a place for a conference, I'm not doing fifty different tasks. I'm doing one task — find the best listing — at fifty incompatible zoom levels. I dig through branding, photo carousels, and house rules to extract the same five deciding factors, then try to keep them all in my head while I click the next tab.

We already know how to fix this for maps. Nobody expects Google Maps to show aquarium exhibit names when they're planning a drive from San Francisco to Monterey. Zoom out, detail hides, the interface changes shape, the task changes scale. Same territory, different representation.

I think software for knowledge work needs the same property — and it doesn't require replacing interfaces with chatbots.

## The ladder already exists

This isn't a new idea. Brett Victor's [Up and Down the Ladder of Abstraction](http://worrydream.com/LadderOfAbstraction/) framed it for programming. An Adept design talk — [Climbing the ladder of abstraction](https://www.youtube.com/watch?v=PAy_GHUAICw) — shows what it looks like when AI glues zoom levels together for Airbnb search: detail page → comparison table → scatter plot, with actions preserved at every level.

The line that stuck with me:

> I'm not trying to argue that higher levels are better — instead… make it easy to move between them.

Spreadsheets are the older precedent. VisiCalc didn't automate arithmetic; calculators already existed. It stacked automatic recalculation into a structured grid so changing one cell updated the whole sheet. Augmentation as composed automations — not a chatbot summarizing your ledger.

Maps select representation by scale. Spreadsheets select representation by formula structure. Neither asks you to hold the zoomed-out view in working memory while staring at the zoomed-in view.

## Fractal Responsiveness

**Fractal Responsiveness** is my name for applying that principle to semantic UI: the same entity (or collection, or page) can occupy the screen as a dot, a row, a card, or a full detail surface — controlled by a continuous **vantage** parameter, not by navigating to a different route.

In the playground we expose vantage as a CSS custom property (`--vantage`) and a slider from 1–13. The UI doesn't shrink — it **changes projection**.

We've organized the exploration into four containment levels:

| Demo | Question |
|------|----------|
| **Entity** | What does one record look like from dot to full detail? |
| **Collection** | What projection fits when many records share the view? |
| **Page** | How does a page exist as a node among pages *and* as a rendered layout? |
| **App** | What happens when vantage applies to the whole product shell? |

Entity and Collection are live. Page and App are sketched — the ladder is visible even where the demos are still thin.

**Embed (optional reference):** `https://playground.trellis.computer/fractals/ladder?embed=1` — static overview of levels and projection bands.

## One entity, many shells

At the entity level, a single readonly record morphs through six presentations driven by the same vantage slider:

`dot → chip → row → card → panel → page`

The record doesn't change. The container does. At low vantage you get identity and color; at high vantage you get fields, related links, and room to edit.

**Embed — vantage 1 (dot):** `https://playground.trellis.computer/fractals/entity?embed=1&vantage=1`

**Embed — vantage 12 (page):** `https://playground.trellis.computer/fractals/entity?embed=1&vantage=12`

[Open entity demo →](https://playground.trellis.computer/fractals/entity)

## Many entities, many projections

Collections are where fractal UI stops being a party trick and becomes a product mechanism.

The same live `Card` collection in Trellis switches **board projection** as vantage changes:

| Vantage | Projection |
|---------|------------|
| 1–3 | Graph — D3 dot field, one point per card |
| 3–6 | Table — spreadsheet rows |
| 6–8 | List — compact rows with swatch + title |
| 8–13 | Grid — editable cards |

This isn't four pages. It's one graph, four views. Search and CRUD stay wired; only the projection collapses.

**Embed — dot field:** `https://playground.trellis.computer/fractals/collection?embed=1&vantage=1`

**Embed — card grid:** `https://playground.trellis.computer/fractals/collection?embed=1&vantage=10`

[Open collection demo →](https://playground.trellis.computer/fractals/collection)

Preset buttons jump to band centers (dots, table, list, cards). The slider fine-tunes inside and between bands.

## The graph underneath

Fractal projections are only interesting if the data is real.

The kanban board is a live Trellis collection — create a card, edit the title inline, drag across lanes, and open a second tab with the **same URL**: changes sync over WebSocket. Presence cursors and focus rings show who else is on the board (same browser today; cross-browser after relay deploy).

**Embed:** `https://playground.trellis.computer/projections/kanban?embed=1&room=fractals-blog`

*Caption for readers: open that URL in two tabs side-by-side — move the mouse and edit a card in one tab to see cursors and sync in the other.*

[Open kanban demo →](https://playground.trellis.computer/projections/kanban?room=fractals-blog)

This is the contrast with chatbot-first AI UI. The Adept talk imagines models generating zoom levels on demand. Trellis takes a different bet: **the graph is the source of truth**, projections are views, servers may accelerate sync but never own state. AI can help populate or transform levels later — but the ladder should be navigable without a conversation.

## What's next

**Page** — a route among routes at low vantage; a full layout with graph-derived sidebar at high vantage. Sketch live at [/fractals/page](https://playground.trellis.computer/fractals/page) (embed: `?embed=1`).

**App** — the fourth-wall demo: collapse the playground shell itself from full app → dialog → card → badge → dot. Sketch at [/fractals/app](https://playground.trellis.computer/fractals/app). Post-MVP, but it's the slide that wins the room.

**Inset hierarchy** — containment-first depth signaling so zoom feels like moving through surfaces, not swapping pages. Fractal Responsiveness is the navigation; inset hierarchy is the visual grammar.

## Try it

Hub: [playground.trellis.computer/fractals](https://playground.trellis.computer/fractals)

Embed gallery (QA): [playground.trellis.computer/fractals/embeds](https://playground.trellis.computer/fractals/embeds)

Copy-paste iframe specs: [`docs/fractals-blog-embeds.md`](fractals-blog-embeds.md) in the repo.

```
/fractals/ladder?embed=1
/fractals/entity?embed=1&vantage=1
/fractals/entity?embed=1&vantage=12
/fractals/collection?embed=1&vantage=1
/fractals/collection?embed=1&vantage=10
/fractals/page?embed=1&vantage=1
/fractals/page?embed=1&vantage=11
/projections/kanban?embed=1&room=fractals-blog
```

`?room=` picks a shared session slug — no server-side “create room” step. New room = new slug in the URL.

---

*Prior art: [Adept — Climbing the ladder of abstraction](https://www.youtube.com/watch?v=PAy_GHUAICw) · [Brett Victor — Ladder of Abstraction](http://worrydream.com/LadderOfAbstraction/) · [Trellis playground](https://playground.trellis.computer/fractals)*
