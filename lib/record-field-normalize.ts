import { parseHexColor } from '@/lib/color-utils';

/** Server-safe record field normalization (no lucide-react/dynamic). */

export function recordDateInputValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

export function normalizeRecordColorValue(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return parseHexColor(String(value)) ?? undefined;
}

export function normalizeRecordIconValue(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const text = String(value).trim().toLowerCase();
  return text || undefined;
}
