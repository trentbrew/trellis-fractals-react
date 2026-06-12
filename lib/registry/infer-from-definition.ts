import type { FieldSignal } from './introspect';

type TypeField = {
  name: string;
  valueType?: string;
};

type SchemaDefinitionLike = {
  '@id'?: string;
  label?: string;
  fields?: TypeField[];
};

const TEMPORAL_KEYS = new Set(['start', 'end', 'date', 'due', 'dueAt', 'scheduledAt']);
const LANE_KEYS = new Set(['laneId', 'lane', 'swimlane']);
const SELECT_VALUE_TYPES = new Set(['select', 'enum']);

/** Infer projection signals from a server type definition. */
export function inferFieldSignalsFromDefinition(
  def: SchemaDefinitionLike,
): Set<FieldSignal> {
  const signals = new Set<FieldSignal>();

  for (const field of def.fields ?? []) {
    const { name, valueType = '' } = field;

    if (SELECT_VALUE_TYPES.has(valueType) || name === 'status') {
      signals.add('select');
    }

    if (valueType === 'date' || (valueType === 'rich_text' && isTemporalKey(name))) {
      signals.add('date');
    }

    if (valueType === 'number') {
      signals.add('number');
    }

    if (valueType === 'file') signals.add('file');
    if (valueType === 'url') signals.add('url');

    if (isLaneKey(name)) signals.add('lane');
  }

  return signals;
}

function isTemporalKey(key: string): boolean {
  return TEMPORAL_KEYS.has(key) || key.endsWith('At') || key.endsWith('Date');
}

function isLaneKey(key: string): boolean {
  return LANE_KEYS.has(key);
}
