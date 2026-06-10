import { listCorpusTypes, type CorpusTypeEntry } from '../registry/corpus-registry';

export type DemoRoute = {
  id: string;
  label: string;
  href: string;
};

/** Direct routes to each corpus type's default board (Phases 1-6). */
export const CORPUS_DEMOS: DemoRoute[] = listCorpusTypes().map((entry: CorpusTypeEntry) => ({
  id: entry.demoId,
  label: entry.label,
  href: entry.route,
}));

export const MOTION_LABS: DemoRoute[] = [
  { id: 'grid-crud', label: 'Grid CRUD', href: '/grid' },
  { id: 'planets', label: 'Planets', href: '/planets' },
];

export function currentDemoId(pathname: string): string {
  const all = [...CORPUS_DEMOS, ...MOTION_LABS];
  const match = all.find((demo) => pathname === demo.href || pathname.startsWith(`${demo.href}/`));
  return match?.id ?? 'todos';
}
