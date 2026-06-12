import { detailOpacity, VANTAGE_MAX, type FractalShell } from './vantage-math';

export type DisclosureMode = 'always' | 'fade' | 'mount';

export type FieldDisclosure = {
  visible: boolean;
  opacity: number;
  mode: DisclosureMode;
};

/** Salience tiers — higher weight stays visible at lower vantage. */
export const DISCLOSURE_WEIGHT = {
  identity: 100,
  decision: 85,
  context: 55,
  secondary: 50,
  media: 45,
  detail: 35,
  body: 25,
  tags: 20,
  hidden: 0,
} as const;

const DECISION_FIELD_NAMES = new Set(['price', 'cost', 'amount', 'total']);
const CONTEXT_FIELD_NAMES = new Set(['category', 'status']);
const MEDIA_FIELD_NAMES = new Set(['image', 'url', 'thumbnail', 'photo']);
const BODY_FIELD_NAMES = new Set(['body', 'summary', 'description', 'notes']);
const DETAIL_FIELD_NAMES = new Set(['brand', 'vendor', 'manufacturer']);
const TAG_FIELD_NAMES = new Set(['tags', 'labels']);

/** Card demo overrides — preserves designed grid/list disclosure bands. */
export const CARD_FIELD_DISCLOSURE: Record<string, number> = {
  title: DISCLOSURE_WEIGHT.identity,
  colorIndex: DISCLOSURE_WEIGHT.identity,
  price: DISCLOSURE_WEIGHT.decision,
  category: DISCLOSURE_WEIGHT.context,
  rating: DISCLOSURE_WEIGHT.secondary,
  image: DISCLOSURE_WEIGHT.media,
  brand: DISCLOSURE_WEIGHT.detail,
  body: DISCLOSURE_WEIGHT.body,
  tags: DISCLOSURE_WEIGHT.tags,
  url: DISCLOSURE_WEIGHT.tags,
};

const SHELL_BANDS: Record<FractalShell, { min: number; max: number }> = {
  node: { min: 1, max: 4 },
  row: { min: 3, max: 6 },
  card: { min: 5, max: 12 },
};

function clampWeight(weight: number): number {
  return Math.max(0, Math.min(100, weight));
}

function shellBand(shell: FractalShell) {
  return SHELL_BANDS[shell];
}

function isWithinShell(vantage: number, shell: FractalShell): boolean {
  const { min, max } = shellBand(shell);
  return vantage >= min && vantage <= max;
}

function usesMountMode(fieldName: string, weight: number): boolean {
  const key = fieldName.toLowerCase();
  if (TAG_FIELD_NAMES.has(key)) return true;
  if (DETAIL_FIELD_NAMES.has(key) && weight <= DISCLOSURE_WEIGHT.detail) return true;
  return weight < DISCLOSURE_WEIGHT.body;
}

function fadeParams(weight: number, shell: FractalShell): { threshold: number; slope: number } {
  if (shell === 'row') {
    return { threshold: 4.5, slope: 1 };
  }

  if (weight >= DISCLOSURE_WEIGHT.secondary) {
    return { threshold: 7, slope: 0.7 };
  }

  return { threshold: 8, slope: 0.65 };
}

function mountThreshold(fieldName: string, weight: number, shell: FractalShell): number {
  const key = fieldName.toLowerCase();
  if (key === 'brand') return 9;
  if (TAG_FIELD_NAMES.has(key)) return 10.5;

  const { min, max } = shellBand(shell);
  const range = max - min;
  return min + (1 - weight / 100) * range;
}

/** Infer default salience from field name and optional collection value type. */
export function inferDisclosureWeight(fieldName: string, valueType?: string): number {
  const key = fieldName.toLowerCase();

  if (key === 'title' || valueType === 'title') return DISCLOSURE_WEIGHT.identity;
  if (key === 'colorindex' || key === 'color') return DISCLOSURE_WEIGHT.identity;
  if (DECISION_FIELD_NAMES.has(key)) return DISCLOSURE_WEIGHT.decision;
  if (CONTEXT_FIELD_NAMES.has(key) || valueType === 'select') return DISCLOSURE_WEIGHT.context;
  if (key === 'rating') return DISCLOSURE_WEIGHT.secondary;
  if (MEDIA_FIELD_NAMES.has(key)) return DISCLOSURE_WEIGHT.media;
  if (DETAIL_FIELD_NAMES.has(key)) return DISCLOSURE_WEIGHT.detail;
  if (BODY_FIELD_NAMES.has(key) || valueType === 'rich_text') return DISCLOSURE_WEIGHT.body;
  if (TAG_FIELD_NAMES.has(key)) return DISCLOSURE_WEIGHT.tags;
  if (valueType === 'number') return DISCLOSURE_WEIGHT.secondary;

  return DISCLOSURE_WEIGHT.body;
}

export function disclosureWeightForField(
  fieldName: string,
  valueType?: string,
  override?: number,
): number {
  if (override != null) return clampWeight(override);
  if (fieldName in CARD_FIELD_DISCLOSURE) return CARD_FIELD_DISCLOSURE[fieldName]!;
  return inferDisclosureWeight(fieldName, valueType);
}

/**
 * Resolve whether a field should render at the current vantage within a shell.
 * Pass `shell: 'row'` for list rows and `shell: 'card'` for grid cards.
 */
export function resolveFieldDisclosure(
  weight: number,
  vantage: number,
  shell: FractalShell,
  fieldName = '',
): FieldDisclosure {
  const w = clampWeight(weight);

  if (w >= DISCLOSURE_WEIGHT.identity) {
    return { visible: true, opacity: 1, mode: 'always' };
  }

  if (w <= DISCLOSURE_WEIGHT.hidden) {
    const visible = vantage >= VANTAGE_MAX - 1;
    return { visible, opacity: visible ? 1 : 0, mode: 'mount' };
  }

  if (w >= DISCLOSURE_WEIGHT.decision) {
    if (shell === 'node') {
      return { visible: false, opacity: 0, mode: 'mount' };
    }
    const visible = isWithinShell(vantage, shell) || (shell === 'card' && vantage >= shellBand('card').min);
    return { visible, opacity: visible ? 1 : 0, mode: 'always' };
  }

  if (usesMountMode(fieldName, w)) {
    const threshold = mountThreshold(fieldName, w, shell);
    const visible = vantage >= threshold;
    return { visible, opacity: visible ? 1 : 0, mode: 'mount' };
  }

  const { threshold, slope } = fadeParams(w, shell);
  const opacity = detailOpacity(vantage, threshold, slope);
  const visible = opacity > 0 || shell === 'card';
  return { visible, opacity, mode: 'fade' };
}
