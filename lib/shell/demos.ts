import { listCorpusTypes, type CorpusTypeEntry } from '../registry/corpus-registry';

export type DemoRoute = {
  id: string;
  label: string;
  href: string;
};

/** Projection fixture lab routes — derived boards, not collection destinations. */
export const PROJECTION_DEMOS: DemoRoute[] = listCorpusTypes().map((entry: CorpusTypeEntry) => ({
  id: entry.demoId,
  label: entry.demoLabel ?? entry.label,
  href: entry.route,
}));

/** Extra projection skeletons — not tied to a single corpus type. */
export const PROJECTION_LAB_EXTRAS: DemoRoute[] = [
  { id: 'fractal', label: 'Fractal', href: '/projections/fractal' },
  { id: 'dag', label: 'DAG', href: '/projections/dag' },
  { id: 'json-ld', label: 'JSON-LD', href: '/projections/json-ld' },
  { id: 'gallery', label: 'Gallery', href: '/projections/gallery' },
];

export const ALL_PROJECTION_NAV: DemoRoute[] = [...PROJECTION_DEMOS, ...PROJECTION_LAB_EXTRAS];

/** Moved to the primary icon rail (disabled stubs). */
export const DISABLED_PROJECTION_RAIL_IDS = new Set([
  'dag',
  'json-ld',
  'gallery',
  'fractal',
  'todos',
  'calendar',
  'gantt',
]);

/** Social / collaborative surfaces in the demo secondary sidebar. */
export const SOCIAL_DEMOS: DemoRoute[] = [
  { id: 'posts', label: 'Posts', href: '/projections/posts' },
  { id: 'chat', label: 'Group chat', href: '/projections/chat' },
];

export const MOTION_LABS: DemoRoute[] = [
  { id: 'grid-crud', label: 'Grid CRUD', href: '/grid' },
  { id: 'planets', label: 'Planets', href: '/planets' },
];

export function currentDemoId(pathname: string): string {
  const all = [...ALL_PROJECTION_NAV, ...MOTION_LABS];
  const match = all.find((demo) => pathname === demo.href || pathname.startsWith(`${demo.href}/`));
  return match?.id ?? 'grid-crud';
}
