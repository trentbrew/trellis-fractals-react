import { iconNames, type IconName } from 'lucide-react/dynamic';

/** All Lucide icon ids (kebab-case), including aliases — ~1.7k entries. */
export const LUCIDE_ICON_NAMES = [...iconNames].sort((a, b) => a.localeCompare(b)) as IconName[];

const LUCIDE_ICON_SET = new Set<string>(LUCIDE_ICON_NAMES);

export const DEFAULT_LUCIDE_ICON = 'folder' satisfies IconName;

/** Legacy emoji values from early seed data. */
const LEGACY_EMOJI: Record<string, IconName> = {
  '📁': 'folder',
  '💡': 'lightbulb',
  '📚': 'book-open',
  '🚀': 'rocket',
};

/** Normalize stored icon values to a valid Lucide icon id. */
export function normalizeLucideIconName(name?: string): IconName {
  if (!name) return DEFAULT_LUCIDE_ICON;
  if (LEGACY_EMOJI[name]) return LEGACY_EMOJI[name];
  const normalized = name.toLowerCase();
  return LUCIDE_ICON_SET.has(normalized) ? (normalized as IconName) : DEFAULT_LUCIDE_ICON;
}

export type { IconName };
