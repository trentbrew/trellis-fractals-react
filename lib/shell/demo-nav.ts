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
  OrbitIcon,
  TableIcon,
  WaypointsIcon,
} from 'lucide-react';
import { ALL_PROJECTION_NAV, MOTION_LABS, type DemoRoute } from './demos';

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

export const PROJECTION_NAV: DemoNavItem[] = ALL_PROJECTION_NAV.map((demo) => ({
  ...demo,
  icon: PROJECTION_ICONS[demo.id] ?? ListIcon,
}));

export const MOTION_NAV: DemoNavItem[] = MOTION_LABS.map((demo) => ({
  ...demo,
  icon: MOTION_ICONS[demo.id] ?? LayoutGridIcon,
}));

export function activeDemoLabel(pathname: string): string {
  const match = [...PROJECTION_NAV, ...MOTION_NAV].find(
    (demo) => pathname === demo.href || pathname.startsWith(`${demo.href}/`),
  );
  if (match) return match.label;
  if (pathname.startsWith('/collection')) return 'Collection';
  if (pathname.startsWith('/projections')) return 'Projections';
  return 'Playground';
}
