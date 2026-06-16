# Record form + field validation — scope

Dynamic, schema-driven record forms on the **entity-edit** axis (separate from browse projections like table/kanban). One validation contract consumed by forms, table inline edit, and eventually kernel ontology middleware.

## Architecture

```
TypeField[]  (per-collection record type)
    │
    ├─ normalizeRecordFieldValue / normalizeRecordAttributes
    ├─ validateRecordFromType / validateRecordField
    │
    ├─ RecordForm (core) ── shells: sheet | dialog | page | wizard (later)
    ├─ SpreadsheetTable inline commit
    └─ compileTypeFieldsToOntology → PropertyValueSpecification[] → kernel schema middleware
```

**Browse projections** answer: how do I see many records?  
**Form shells** answer: how do I create/edit one record?

Shell selection is context-driven (toolbar create → sheet, entity focus → dialog), not a tab in `CollectionViewPicker`.

## TypeField contract (v1)

Aligned with kernel `PropertyValueSpecification` where practical:

| Field | Purpose |
| ----- | ------- |
| `name`, `valueType`, `required`, `options` | Existing |
| `min`, `max`, `step` | Number constraints |
| `minLength`, `maxLength`, `pattern` | String constraints |
| `date.includeTime` | Date vs datetime storage |
| `format` | Display hint: `currency`, `percent` (storage stays number) |
| `currency` | ISO 4217 when `format: 'currency'` |
| `placeholder`, `helpText` | Form UX (later) |

Storage decisions (locked for v1):

- **Currency** — decimal `number` in graph; format at UI with `Intl`
- **Phone** — E.164-ish normalized string (`+14155551234`)
- **Rich text length** — plain-text strip of HTML for `maxLength`
- **Date** — ISO date `YYYY-MM-DD` or datetime `YYYY-MM-DDTHH:mm` when `includeTime`

## Phases

### Phase 1 — Foundation (this slice)

- [x] Scope doc
- [x] `lib/schemas/record-fields.ts` — extended `TypeField`, normalize, validate
- [x] Unit tests for validation rules
- [x] `RecordForm` core component
- [x] `RecordFormSheet` shell — extract from create-record flow
- [x] Table: surface validation errors on cell commit (no silent reject)

**Out of scope for Phase 1:** schema editor constraint UI, email/phone value types in picker, wizard shell, kernel compile.

### Phase 2 — Schema editor + types

- [x] Constraint panel in `collection-schema-editor` (per valueType)
- [x] Add `email`, `phone_number` to `VALUE_TYPE_OPTIONS`
- [x] `RecordFieldInput` format hints (currency input, email type, tel)
- [x] `typeToSpreadsheetColumns` passes constraints to `SpreadsheetColumn`

### Phase 3 — Dialog shell + entity focus

- [x] `RecordFormDialog` — pair with `RecordCardDialog` / entity focus morph
- [x] `resolveFormShell(context)` heuristic (field count, viewport, URL)
- [x] Optional `dialogShell` on type definition (kernel parity)
- [x] `?record=<id>` URL focus; open from table double-click, card grid, list expand
- [x] Create shell respects `resolveFormShell` (sheet | dialog)

## Files (Phase 3)

| Path | Role |
| ---- | ---- |
| `lib/forms/resolve-form-shell.ts` | Shell selection heuristic |
| `lib/forms/resolve-form-shell.test.ts` | Shell resolver tests |
| `lib/forms/record-form-values.ts` | Record → form value mapping |
| `components/forms/shells/record-form-dialog.tsx` | Dialog edit/create shell + morph |
| `components/collections/collection-records-projection.tsx` | Entity focus wiring |
| `components/collections/views/collection-records-card-grid.tsx` | Card open + layoutId |
| `components/boards/spreadsheet/SpreadsheetTable.tsx` | `onOpenRow` double-click |
| `lib/trellis/use-types.ts` | `dialogShell`, `formLayout` on `TypeDef` |

### Form layout editor

- [x] Configure sheet **Form** tab — shell, columns, hidden fields, wizard sections
- [x] `normalizeFormLayout` — sanitize layout against editable field names
- [x] Persists `dialogShell` + `formLayout` on collection record type overlay

## Files (form layout editor)

| Path | Role |
| ---- | ---- |
| `components/collections/collection-form-layout-editor.tsx` | Form tab UI |
| `components/collections/collection-configure-sheet.tsx` | Form tab wiring |
| `lib/forms/record-form-layout.ts` | `normalizeFormLayout`, `formLayoutSnapshot` |
| `lib/forms/normalize-form-layout.test.ts` | Layout normalize tests |

### Phase 4 — Layout + wizard

- [x] `FormLayout` on type: `sections`, `fieldOrder`, `hiddenInForm`, `columns`
- [x] `resolveFormSections` + `shouldUseWizardLayout`
- [x] `RecordForm` uses shadcn `Field` / `FieldSet` / `FieldGroup` primitives
- [x] Wizard shell auto-enables when `sections.length > 1`
- [x] Full-page route: `/collections/[slug]/new` (`RecordFormPage`)

## Files (Phase 4)

| Path | Role |
| ---- | ---- |
| `components/ui/field.tsx` | shadcn Field primitives |
| `components/ui/label.tsx` | shadcn Label |
| `lib/forms/record-form-layout.ts` | Sections, order, wizard detection |
| `lib/forms/record-form-layout.test.ts` | Layout unit tests |
| `lib/forms/resolve-form-shell.ts` | Wizard + page shell resolution |
| `components/forms/record-form.tsx` | Sectioned Field-based form core |
| `components/forms/shells/record-form-wizard.tsx` | Multi-step dialog wizard |
| `components/forms/shells/record-form-page.tsx` | Full-page create shell |
| `components/collections/collection-new-record-page.tsx` | `/new` route client page |
| `app/collections/[slug]/new/page.tsx` | Full-page create route |
| `lib/schemas/record-fields.ts` | `validateRecordFieldsByName` for wizard steps |

### Phase 5 — Kernel sync

- [x] `compileTypeFieldsToOntology(fields)` → `PropertyValueSpecification[]`
- [x] `compileCollectionRecordSchema` for full `trellis:Schema` payloads
- [x] Ontology sync compiles TypeField overlays before POST/PATCH to kernel
- [x] Kernel `schema-validation` middleware attached at boot
- [x] Per-collection schema resolution via `collectionMeta:<slug>` on `CollectionRecord` writes
- [x] `PATCH /ontologies/:id` on trellis-node for field updates

## Files (Phase 5)

| Path | Role |
| ---- | ---- |
| `lib/schemas/compile-type-fields.ts` | TypeField → PropertyValueSpecification compile |
| `lib/schemas/compile-type-fields.test.ts` | Compile unit tests |
| `lib/trellis/ontology-server.ts` | Compiled sync to kernel sidecar |
| `trellis-node/src/core/kernel/schema-middleware.ts` | Write-path validation + per-collection lookup |
| `trellis-node/src/core/kernel/boot-middleware.ts` | Attach schema middleware at boot |
| `trellis-node/src/server/server.ts` | `PATCH /ontologies/:id` handler |

## Validation rules (v1)

| valueType | Rules |
| --------- | ----- |
| title, string, rich_text | required, minLength, maxLength, pattern |
| number | required, min, max, finite parse |
| boolean | required only |
| date | required, valid ISO date/datetime per `includeTime` |
| url | required, `new URL()` |
| email | required, email format |
| phone_number | required, loose E.164 / digit minimum |
| select | required, option membership |
| color | required, `#RRGGBB` |

## Files (Phase 1)

| Path | Role |
| ---- | ---- |
| `lib/schemas/record-fields.ts` | TypeField, normalize, validate |
| `lib/schemas/record-fields.test.ts` | Validation tests |
| `lib/forms/record-form-layout.ts` | FormLayout types (stub) |
| `components/forms/record-form.tsx` | Schema-driven field list |
| `components/forms/shells/record-form-sheet.tsx` | Right sidebar create/edit |
| `components/collections/collection-records-projection.tsx` | Use RecordFormSheet |
| `components/boards/spreadsheet/SpreadsheetTable.tsx` | Cell commit error state |

## Files (Phase 2)

| Path | Role |
| ---- | ---- |
| `lib/registry/field-constraints.ts` | Constraint helpers, normalize, display format |
| `lib/registry/field-constraints.test.ts` | Constraint unit tests |
| `components/collections/schema-field-constraints.tsx` | Per-field constraint editor UI |
| `components/collections/collection-schema-editor.tsx` | Wired constraints panel |
| `components/collections/type-fields-editor.tsx` | Wired constraints panel |
| `lib/registry/type-columns.ts` | Email/phone types, column constraint mapping |
| `components/collections/record-field-input.tsx` | Typed inputs + datetime-local |
| `components/boards/spreadsheet/SpreadsheetTable.tsx` | Column constraints on cells |
| `lib/trellis/use-types.ts` | `TypeDef.fields` uses full `TypeField` |

## Acceptance (Phase 2)

1. Schema editor shows constraint panel for text, number, and date fields.
2. Saved constraints persist on the collection record type and round-trip through normalize.
3. Table columns receive min/max/maxLength; inline edit honors HTML constraints.
4. Email and phone field types available in type picker with correct input types in forms.
