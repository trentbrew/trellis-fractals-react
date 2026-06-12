# Database-Style Spreadsheet Table Projection

Tracking issue: TRL-4
Parent issue: TRL-2

## Purpose

Bring the table and collection-record views in this Next playground much closer to
the database/CMS table surface from:

- `/Users/trentbrew/TURTLE/Projects/Packages/turtlecode/ide/packages/app/src/components/cms/entries-table.tsx`
- `/Users/trentbrew/TURTLE/Projects/Packages/turtlecode/ide/packages/app/src/components/database/records-tab.tsx`
- `/Users/trentbrew/TURTLE/Projects/Packages/turtlecode/ide/packages/app/src/components/database/facts-tab.tsx`
- `/Users/trentbrew/TURTLE/Projects/Packages/turtlecode/ide/packages/app/src/components/database/links-tab.tsx`

The target is not a literal copy. The source implementation is Solid, uses
`@opencode-ai/ui`, and works over raw Trellis entities/facts/links. This app is
React/Next, uses shadcn/Base UI primitives, and currently exposes typed records
through `useCollection()`. The right implementation is a React-native
spreadsheet projection that borrows the proven interaction model.

## Current State

The current table surfaces are intentionally small:

- `components/boards/table/TableBoard.tsx` renders a schema-derived editable
  table for the `Card` demo type.
- `components/boards/table/EditableTableRow.tsx` supports inline text editing
  and delete.
- `components/collections/collection-records-projection.tsx` renders a fixed
  `Title` / `Body` table or list for collection records.
- `lib/trellis/use-collection.ts` is the main graph ingress for typed boards.
- `lib/registry/browse-config.ts` derives searchable/sortable fields and table
  columns from Zod-backed Trellis schemas.

That gives us a good foundation for typed rows, but it does not yet provide a
database-grade spreadsheet surface: no virtual rows, sticky rails, column
resizing, per-column filters, type-aware cell controls, row selection, or raw
facts/links modes.

## Goals

1. Match the database/CMS table's dense operational feel.
2. Keep the implementation idiomatic to this React/Next codebase.
3. Preserve `useCollection()` as the initial typed data path.
4. Add a generic table engine that can power both demo boards and collection
   records.
5. Make raw graph parity possible without blocking the first useful version.
6. Verify the table through unit-level behavior checks, build/lint, and focused
   Playwright coverage.

## Non-Goals

- Do not import Solid components.
- Do not add `@opencode-ai/ui` as a dependency just to clone styles.
- Do not replace every board with the new table surface in the first milestone.
- Do not implement XLSX editing or `x-data-spreadsheet`; that is a separate file
  editor surface in the reference app.
- Do not depend on raw `.trellis/` mutation. All tracking stays through the
  Trellis CLI and app mutations stay through supported Trellis client APIs.

## Target UX

The first-viewport table should read as a dense database/spreadsheet tool, not a
plain HTML table.

Core anatomy:

- Compact toolbar with search, result count, sort/filter affordances, and add
  row.
- Scrollable table well with sticky top header.
- Sticky left rail with row checkbox, row index, and entity ID/short ID.
- Primary entry/title column immediately after the ID rail.
- Dynamic schema-derived columns.
- Optional backlinks/relationships column.
- Sticky right action rail.
- Bottom "New row" affordance inside the table scroll context.
- Selection action bar when rows are checked.

Core interactions:

- Click header to sort, cycling ascending, descending, none.
- Open a column filter menu from the header.
- Drag header edge to resize a column; double-click resets width.
- Click into editable cells; blur or keyboard navigation persists.
- Tab / Shift+Tab moves across editable cells.
- Enter commits and advances down when possible.
- Escape cancels draft edit.
- Shift-click row checkboxes selects a contiguous range.
- Row actions support delete and later duplicate/open details.

## Visual Fidelity Notes

The source table gets most of its feel from a few repeatable primitives:

- 42px row height.
- 36px checkbox rail.
- 40px row index rail.
- Sticky ID rail with subtle right shadow.
- 9px-12px type scale for table chrome.
- Uppercase, low-contrast header labels.
- Thin vertical borders between columns.
- Icon-leading column labels.
- Compact pill controls for select/reference cells.
- Muted hover backgrounds and stronger selected-row backgrounds.

This app can recreate those with Tailwind tokens backed by the existing
`--background`, `--card`, `--border`, `--muted`, and `--foreground` variables.
Avoid introducing the reference app's token names (`bg-well`, `bg-elevated`,
`text-text-weak`, etc.) unless we intentionally add a compatibility layer.

## Proposed Architecture

Create a reusable spreadsheet package:

```text
components/boards/spreadsheet/
  SpreadsheetBoard.tsx
  SpreadsheetTable.tsx
  SpreadsheetToolbar.tsx
  SpreadsheetHeaderCell.tsx
  SpreadsheetRow.tsx
  SpreadsheetCell.tsx
  SpreadsheetCellEditor.tsx
  SpreadsheetSelectionBar.tsx
  ColumnResizeHandle.tsx
  hooks/
    use-column-widths.ts
    use-virtual-rows.ts
    use-spreadsheet-state.ts
    use-cell-draft.ts
  types.ts
```

The component should not know about one schema. It should receive a row adapter:

```ts
type SpreadsheetRow = {
  id: string;
  type?: string;
  values: Record<string, unknown>;
};

type SpreadsheetColumn = {
  key: string;
  label: string;
  kind: 'text' | 'longtext' | 'number' | 'date' | 'boolean' | 'select' | 'reference' | 'formula' | 'readonly';
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  required?: boolean;
  readOnly?: boolean;
  options?: string[];
  formula?: string;
};

type SpreadsheetAdapter = {
  rows: SpreadsheetRow[];
  columns: SpreadsheetColumn[];
  loading?: boolean;
  createRow: () => Promise<void> | void;
  updateCell: (rowId: string, key: string, value: unknown) => Promise<void> | void;
  deleteRow: (rowId: string) => Promise<void> | void;
};
```

Initial adapters:

- `typedCollectionAdapter(schema, rows, mut)` for demo boards.
- `collectionRecordsAdapter(collection, rows, recordMut)` for collection pages.

Future adapters:

- `graphEntityAdapter(type?)` for database-style records over raw entities.
- `graphFactsAdapter(type?)` for facts table parity.
- `graphLinksAdapter(type?)` for relationship table parity.

## Data Model Strategy

Phase 1 should operate over typed row objects, because that is what this app
already has.

Column inference can extend `lib/registry/browse-config.ts`:

- Strings become editable text.
- Long strings or known body/description fields become long text.
- Numbers become numeric editors and range filters.
- Booleans become switches.
- Enums become select pills.
- Date-like strings or Zod date fields become date editors.
- `id`, `type`, sort metadata, and foreign keys are readonly or hidden by
  default, depending on adapter.

Raw graph parity requires an additional data ingress. The Trellis SDK exposes
`list`, `read`, `query`, `create`, `update`, and `delete`; it does not currently
expose a React hook equivalent to the reference app's `store.entities`,
`store.facts`, `store.links`, `assert`, and `retract` shape. We should avoid
blocking typed-table progress on this. Add raw database tabs only after we
either:

- create a local React graph-store hook over supported Trellis APIs, or
- add/consume official Trellis client support for raw facts/links reads.

## State Model

Keep table state local to the spreadsheet component until there is a clear need
for URL persistence.

State:

- `query`
- `sort: { key: string | null; dir: 'asc' | 'desc' }`
- `filters: Record<string, ColumnFilter>`
- `selected: Record<string, boolean>`
- `lastSelectedId`
- `editing: { rowId: string; key: string } | null`
- `draft`
- `pending: Record<string, { value: unknown; seq: number }>`
- `columnWidths: Record<string, number>`
- `scrollTop` and `viewportHeight` for virtualization

Persisted state:

- Column widths in `localStorage`, keyed by table identity.

Do not persist:

- Active edit draft.
- Selection.
- Pending writes.

## Component Behavior

### Virtual Rows

Use fixed-height virtualization first. A tiny custom hook is enough:

- row height: 42px desktop.
- overscan: 10 rows.
- visible range derived from scroll top and viewport height.
- absolute-positioned rows inside a spacer div.

Do not bring in a virtualization dependency unless variable-height rows become a
hard requirement.

### Sticky Columns

Use CSS `position: sticky` with explicit left offsets:

- select rail: `left: 0`, width 36.
- row index rail: `left: 36px`, width 40.
- ID rail: `left: 76px`, configurable width.

The primary entry column can remain non-sticky initially. If it feels necessary,
make it sticky only after validating horizontal scroll behavior.

### Column Widths

Use the source table's simple pointer model:

- clamp width between 80 and 480.
- set body cursor to `col-resize` during drag.
- disable body text selection during drag.
- double-click resets the saved width.

React implementation should clean up listeners in all exit paths.

### Cell Editing

Start with these editors:

- text input.
- number input.
- date input.
- boolean switch.
- readonly text.

Then add:

- select dropdown pills.
- reference pills.
- formula display cells.
- color/icon pickers only if the collection schema needs them.

Use a focus-safe draft pattern similar to `useFocusSafeField`, but table cells
need keyboard navigation, pending-write tracking, and commit/cancel semantics.

### Filtering

Column filters:

- enum/select: checkbox list.
- boolean: true/false/empty.
- number/date: min/max range.
- text/longtext/reference: contains.

Global search remains simple text search over visible row values for the first
milestone.

EQL-S query mode is useful but should be deferred until raw graph adapters exist.

## Integration Plan

### Table Board

Replace the current table body in `components/boards/table/TableBoard.tsx` with
the new `SpreadsheetBoard` adapter for `Card`.

Must preserve:

- add row.
- search/sort behavior.
- inline title/body editing.
- delete.
- context menu delete if still useful.

### Collection Records

Replace the fixed `Title` / `Body` table in
`components/collections/collection-records-projection.tsx` when `viewMode ===
'table'`.

Must preserve:

- collection title editing.
- record create form or table-bottom create affordance.
- title/body validation.
- add/edit/delete test IDs used by `e2e/collections.spec.ts`, or update tests in
  the same change.

### Future Database Route

Add a distinct database/raw graph route only after the table engine is stable.
That route should map the reference app's tabs:

- Records
- Facts
- Relationships
- JSON-LD

## Phases

### Phase 0: Scope and Tracking

Deliverables:

- This document.
- TRL-4 issue with acceptance criteria.

Exit criteria:

- Doc is committed/tracked.
- Issue has clear AC for implementation.

### Phase 1: Spreadsheet Shell

Deliverables:

- Generic spreadsheet components.
- Fixed-height virtualization.
- Sticky header and left rails.
- Horizontal scroll.
- Column width calculation and resizing.
- Empty state.
- Bottom new-row affordance.

Exit criteria:

- Table renders 500+ rows without DOM blowup.
- Header, ID rail, and action rail stay positioned during scroll.
- Column widths persist and reset.

### Phase 2: Core Table Operations

Deliverables:

- Global search.
- Header sort.
- Per-column filters.
- Row selection and selection bar.
- Inline editing for text, number, date, boolean.
- Keyboard commit/navigation.
- Pending write handling.

Exit criteria:

- Typed `Card` table supports add/edit/delete/search/sort/filter/select.
- No lost local draft while remote row data refreshes.

### Phase 3: Collection Integration

Deliverables:

- Collection record adapter.
- Collection page table replacement.
- Test compatibility pass.

Exit criteria:

- Existing collection add/edit/delete flows still pass.
- Collection table uses the same spreadsheet engine as `TableBoard`.

### Phase 4: Type-Aware Cells

Deliverables:

- Enum/select pills.
- Required field markers.
- Readonly ID/metadata cells.
- Formula display cells for local/schema formulas.
- Reference pill display, with mutation if supported by schema.

Exit criteria:

- Common CMS/database table cells visually match the reference behavior.
- Unsupported cell kinds degrade to readonly text.

### Phase 5: Raw Graph Views

Deliverables:

- React graph-store hook or adapter.
- Records tab parity.
- Facts table parity.
- Links/relationships table parity.
- JSON-LD mode.

Exit criteria:

- User can inspect raw Trellis records/facts/links from the playground.
- Large stores use virtualization.

### Phase 6: Polish and Hardening

Deliverables:

- Playwright coverage for table interactions.
- Accessibility pass for keyboard and screen reader labels.
- Mobile/narrow viewport behavior.
- Visual pass in light and dark themes.

Exit criteria:

- `pnpm run lint` passes.
- `pnpm run build` passes.
- Focused E2E tests pass.

## Risks

### Solid-to-React Translation

The reference table relies on Solid's fine-grained reactivity. Directly porting
the state shape into React can cause over-rendering. Keep derived state memoized
and row components narrow.

### Raw Fact Access

The reference app has direct `store.facts` and `store.links`. This app currently
uses typed Trellis hooks. Raw database parity may require new client support or a
careful adapter over `client.query()`.

### Sticky + Virtualized Layout

Sticky columns inside a horizontally and vertically scrolling virtual table are
easy to make flaky. Keep row heights fixed until the interaction model is solid.

### Existing Dirty Worktree

There are broad existing changes in this repo. Implementation changes should
stay narrowly scoped and avoid unrelated formatting churn.

### Test IDs

The collection E2E tests depend on specific `data-testid` and row attributes.
Keep those stable or update tests with the feature.

## Verification Plan

Run before closing TRL-4:

```bash
pnpm run lint
pnpm run build
pnpm run test:e2e -- e2e/collections.spec.ts
```

Add focused tests as implementation lands:

- column inference tests.
- filter/sort reducer tests.
- keyboard editing tests where practical.
- Playwright table smoke for add, edit, delete, resize, select.

## TrellisVCS Tracking

Primary issue:

- TRL-4: Port database-style spreadsheet table projection

Suggested child issues if TRL-4 becomes too large:

- Spreadsheet shell and virtualization.
- Typed table board adapter.
- Collection records adapter.
- Column filters and resize persistence.
- Type-aware cells.
- Raw records/facts/links database tabs.

Golden-path commands:

```bash
trellis issue show TRL-4
trellis issue start TRL-4
trellis issue check TRL-4
trellis milestone create -m "Scoped database-style spreadsheet table projection"
```

Do not close TRL-4 until the implementation is complete and all acceptance
criteria pass.

## Open Decisions

1. Should `TableBoard` be replaced in place, or should the new surface launch as
   a separate route first?
2. Should collection record creation move into the table bottom row, or should
   the existing form remain above the table?
3. Should raw facts/links support wait for official Trellis React hooks?
4. How much of the reference app's dark dense color language should this app
   adopt globally?
5. Should EQL-S query mode be table-local, or part of the shared browse shell?
