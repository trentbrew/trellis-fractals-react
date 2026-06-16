/** Section grouping for wizard / long forms (Phase 4). */
export type FormLayoutSection = {
  title?: string;
  description?: string;
  fields: string[];
};

export type FormLayout = {
  sections?: FormLayoutSection[];
  fieldOrder?: string[];
  hiddenInForm?: string[];
  columns?: 1 | 2;
};

export type FormShellKind = 'inline' | 'sheet' | 'dialog' | 'page' | 'wizard';

export function resolveFormFieldOrder(
  fieldNames: string[],
  layout?: FormLayout,
): string[] {
  const hidden = new Set(layout?.hiddenInForm ?? []);
  const visible = fieldNames.filter((name) => !hidden.has(name));
  if (!layout?.fieldOrder?.length) return visible;

  const orderIndex = new Map(layout.fieldOrder.map((name, index) => [name, index]));
  return [...visible].sort((a, b) => {
    const ai = orderIndex.get(a) ?? Number.MAX_SAFE_INTEGER;
    const bi = orderIndex.get(b) ?? Number.MAX_SAFE_INTEGER;
    return ai - bi;
  });
}

/** True when the type defines multiple form sections (wizard shell). */
export function shouldUseWizardLayout(layout?: FormLayout): boolean {
  return (layout?.sections?.length ?? 0) > 1;
}

/**
 * Resolves visible sections from layout + field list.
 * Fields not listed in any section appear in a trailing "Other" group.
 */
export function resolveFormSections(
  fieldNames: string[],
  layout?: FormLayout,
): FormLayoutSection[] {
  const ordered = resolveFormFieldOrder(fieldNames, layout);
  if (!layout?.sections?.length) {
    return ordered.length ? [{ fields: ordered }] : [];
  }

  const used = new Set<string>();
  const sections: FormLayoutSection[] = [];

  for (const section of layout.sections) {
    const fields = section.fields.filter((name) => ordered.includes(name) && !used.has(name));
    for (const name of fields) used.add(name);
    if (fields.length > 0) {
      sections.push({
        title: section.title,
        description: section.description,
        fields,
      });
    }
  }

  const remainder = ordered.filter((name) => !used.has(name));
  if (remainder.length > 0) {
    sections.push({ title: 'Other', fields: remainder });
  }

  return sections;
}

/** Strip unknown fields and empty sections from a draft layout. */
export function normalizeFormLayout(
  layout: FormLayout | undefined,
  fieldNames: string[],
): FormLayout | undefined {
  if (!layout) return undefined;

  const allowed = new Set(fieldNames);
  const result: FormLayout = {};

  if (layout.columns === 2) result.columns = 2;

  const hidden = (layout.hiddenInForm ?? []).filter((name) => allowed.has(name));
  if (hidden.length > 0) result.hiddenInForm = hidden;

  const sections = (layout.sections ?? [])
    .map((section) => ({
      title: section.title?.trim() || undefined,
      description: section.description?.trim() || undefined,
      fields: section.fields.filter((name) => allowed.has(name)),
    }))
    .filter((section) => section.fields.length > 0);

  if (sections.length > 0) result.sections = sections;

  const fieldOrder = (layout.fieldOrder ?? []).filter((name) => allowed.has(name));
  if (fieldOrder.length > 0) result.fieldOrder = fieldOrder;

  return Object.keys(result).length > 0 ? result : undefined;
}

export function formLayoutSnapshot(layout: FormLayout | undefined): string {
  return JSON.stringify(layout ?? {});
}
