import type { LucideIcon } from 'lucide-react';
import {
  BracesIcon,
  CalendarIcon,
  GanttChartIcon,
  GitBranchIcon,
  ImagesIcon,
  LayoutDashboardIcon,
  LayoutGridIcon,
  ListIcon,
  MessageSquareIcon,
  MessagesSquareIcon,
  OrbitIcon,
  TableIcon,
  WaypointsIcon,
} from 'lucide-react';
import {
  ALL_PROJECTION_NAV,
  DISABLED_PROJECTION_RAIL_IDS,
  MOTION_LABS,
  SOCIAL_DEMOS,
  type DemoRoute,
} from './demos';

export type DemoNavItem = DemoRoute & {
  icon: LucideIcon;
};

const PROJECTION_ICONS: Record<string, LucideIcon> = {
  todos: ListIcon,
  table: TableIcon,
  kanban: LayoutDashboardIcon,
  calendar: CalendarIcon,
  gantt: GanttChartIcon,
  fractal: WaypointsIcon,
  dag: GitBranchIcon,
  'json-ld': BracesIcon,
  gallery: ImagesIcon,
};

const MOTION_ICONS: Record<string, LucideIcon> = {
  'grid-crud': LayoutGridIcon,
  planets: OrbitIcon,
};

const SOCIAL_ICONS: Record<string, LucideIcon> = {
  posts: MessageSquareIcon,
  chat: MessagesSquareIcon,
};

function withIcon(demo: DemoRoute, icons: Record<string, LucideIcon>, fallback: LucideIcon): DemoNavItem {
  return { ...demo, icon: icons[demo.id] ?? fallback };
}

export const PROJECTION_NAV: DemoNavItem[] = ALL_PROJECTION_NAV.map((demo) =>
  withIcon(demo, PROJECTION_ICONS, ListIcon),
);

export const SOCIAL_NAV: DemoNavItem[] = SOCIAL_DEMOS.map((demo) =>
  withIcon(demo, SOCIAL_ICONS, MessageSquareIcon),
);

/** Active demo surfaces — flat secondary sidebar (social + live boards). */
export const DEMO_SURFACE_NAV: DemoNavItem[] = [
  ...SOCIAL_NAV,
  ...PROJECTION_NAV.filter((demo) => !DISABLED_PROJECTION_RAIL_IDS.has(demo.id)),
];

/** Hidden from nav — routes still work via direct URL / embeds. */
export const HIDDEN_PROJECTION_DEMOS: DemoNavItem[] = [
  'dag',
  'json-ld',
  'gallery',
  'fractal',
  'todos',
  'calendar',
  'gantt',
]
  .map((id) => PROJECTION_NAV.find((demo) => demo.id === id))
  .filter((demo): demo is DemoNavItem => demo != null);

export const MOTION_NAV: DemoNavItem[] = MOTION_LABS.map((demo) =>
  withIcon(demo, MOTION_ICONS, LayoutGridIcon),
);

/** First item in the demo sidebar — default landing for /projections. */
export const DEMO_SURFACE_DEFAULT_HREF = DEMO_SURFACE_NAV[0]?.href ?? '/projections/posts';

export function activeDemoLabel(pathname: string): string {
  const match = [...DEMO_SURFACE_NAV, ...HIDDEN_PROJECTION_DEMOS, ...MOTION_NAV].find(
    (demo) => pathname === demo.href || pathname.startsWith(`${demo.href}/`),
  );
  if (match) return match.label;
  if (pathname.startsWith('/collection')) return 'Collection';
  if (pathname.startsWith('/projections')) return 'Social';
  return 'Playground';
}
