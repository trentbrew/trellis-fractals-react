import type { FormLayout, FormShellKind } from '@/lib/forms/record-form-layout';
import type { TypeField } from '@/lib/schemas/record-fields';

/** Kernel `PropertyValueSpecification.valueType` subset used by collection records. */
export type OntologyPropertyType =
  | 'title'
  | 'rich_text'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'date'
  | 'email'
  | 'phone_number'
  | 'url'
  | 'relation'
  | 'json';

export type PropertyValueSpecification = {
  name: string;
  valueType: OntologyPropertyType;
  required?: boolean;
  description?: string;
  selectOptions?: string[];
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  editable?: boolean;
};

export type CompiledCollectionSchema = {
  '@id': string;
  '@type': 'trellis:Schema';
  version: string;
  tier: 'user';
  subClassOf: 'core:Record';
  label?: string;
  icon?: string;
  color?: string;
  dialogShell?: FormShellKind;
  fields: PropertyValueSpecification[];
};

const TYPE_FIELD_TO_ONTOLOGY: Record<string, OntologyPropertyType> = {
  title: 'title',
  string: 'rich_text',
  rich_text: 'rich_text',
  number: 'number',
  boolean: 'checkbox',
  date: 'date',
  email: 'email',
  phone_number: 'phone_number',
  url: 'url',
  select: 'select',
  enum: 'select',
  color: 'rich_text',
  icon: 'rich_text',
  reference: 'rich_text',
  relationship: 'rich_text',
};

const STRING_ONTOLOGY_TYPES = new Set<OntologyPropertyType>([
  'title',
  'rich_text',
  'email',
  'phone_number',
  'url',
]);

export function compileTypeFieldToOntology(field: TypeField): PropertyValueSpecification {
  const valueType = TYPE_FIELD_TO_ONTOLOGY[field.valueType ?? 'string'] ?? 'rich_text';
  const spec: PropertyValueSpecification = {
    name: field.name,
    valueType,
  };

  if (field.required) spec.required = true;
  if (field.helpText?.trim()) spec.description = field.helpText.trim();

  if (valueType === 'number') {
    if (field.min !== undefined) spec.min = field.min;
    if (field.max !== undefined) spec.max = field.max;
  }

  if (STRING_ONTOLOGY_TYPES.has(valueType)) {
    if (field.minLength !== undefined) spec.minLength = field.minLength;
    if (field.maxLength !== undefined) spec.maxLength = field.maxLength;
    if (field.pattern) spec.pattern = field.pattern;
    if (field.valueType === 'color' && !field.pattern) {
      spec.pattern = '^#[0-9a-fA-F]{6}$';
    }
  }

  if (valueType === 'select' && field.options?.length) {
    spec.selectOptions = field.options.map((option) => option.trim()).filter(Boolean);
  }

  return spec;
}

export function compileTypeFieldsToOntology(fields: TypeField[]): PropertyValueSpecification[] {
  return fields
    .filter((field) => field.name.trim().length > 0)
    .map(compileTypeFieldToOntology);
}

export function compileCollectionRecordSchema(input: {
  id: string;
  label?: string;
  fields: TypeField[];
  icon?: string;
  color?: string;
  dialogShell?: FormShellKind;
  formLayout?: FormLayout;
}): CompiledCollectionSchema {
  return {
    '@id': input.id,
    '@type': 'trellis:Schema',
    version: '1.0.0',
    tier: 'user',
    subClassOf: 'core:Record',
    label: input.label,
    fields: compileTypeFieldsToOntology(input.fields),
    ...(input.icon !== undefined ? { icon: input.icon } : {}),
    ...(input.color !== undefined ? { color: input.color } : {}),
    ...(input.dialogShell ? { dialogShell: input.dialogShell } : {}),
  };
}

/** Extract collection slug from `collectionMeta:<slug>` stable ids. */
export function collectionSlugFromCollectionId(collectionId: string): string | null {
  const prefix = 'collectionMeta:';
  if (!collectionId.startsWith(prefix)) return null;
  const slug = collectionId.slice(prefix.length).trim();
  return slug || null;
}
