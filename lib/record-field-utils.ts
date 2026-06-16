import { format, isValid, parseISO } from 'date-fns';
import { normalizeLucideIconName } from '@/lib/icons/lucide-icons';
import {
  normalizeRecordColorValue,
  recordDateInputValue,
} from '@/lib/record-field-normalize';

export { normalizeRecordColorValue, recordDateInputValue } from '@/lib/record-field-normalize';

export function parseRecordDate(value: unknown): Date | undefined {
  const text = recordDateInputValue(value);
  if (!text) return undefined;
  const parsed = parseISO(text);
  return isValid(parsed) ? parsed : undefined;
}

export function formatRecordDateLabel(value: unknown): string {
  const date = parseRecordDate(value);
  if (!date) return '';
  return format(date, 'MMM d, yyyy');
}

export function recordDateToStorage(date: Date | undefined): string | undefined {
  if (!date || !isValid(date)) return undefined;
  return format(date, 'yyyy-MM-dd');
}

export function normalizeRecordIconValue(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return normalizeLucideIconName(String(value));
}

export function recordColorDisplay(value: unknown): string {
  return normalizeRecordColorValue(value) ?? '';
}

export function recordIconDisplay(value: unknown): string {
  return normalizeRecordIconValue(value) ?? '';
}
