import type { LucideIcon } from 'lucide-react';
import {
  CircleDotIcon,
  GitBranchIcon,
  LayersIcon,
  NetworkIcon,
  PanelsTopLeftIcon,
  WaypointsIcon,
} from 'lucide-react';
import { fractalRouteLabel } from '@/lib/shell/fractals';

export type ShellMode =
  | 'collections'
  | 'fractals'
  | 'graph'
  | 'realtime'
  | 'issues'
  | 'projections';

export type PrimaryNavItem = {
  id: ShellMode;
  label: string;
  href: string;
  icon: LucideIcon;
};

export const PRIMARY_NAV: PrimaryNavItem[] = [
  { id: 'collections', label: 'Collections', href: '/collections', icon: LayersIcon },
  { id: 'fractals', label: 'Fractals', href: '/fractals', icon: WaypointsIcon },
  { id: 'projections', label: 'Projections', href: '/projections', icon: PanelsTopLeftIcon },
  { id: 'graph', label: 'Graph', href: '/graph', icon: NetworkIcon },
  { id: 'realtime', label: 'Realtime', href: '/realtime', icon: CircleDotIcon },
  { id: 'issues', label: 'Issues', href: '/issues', icon: GitBranchIcon },
];

export function shellModeFromPath(pathname: string): ShellMode {
  if (pathname.startsWith('/collections')) return 'collections';
  if (
    pathname.startsWith('/fractals') ||
    pathname.startsWith('/grid') ||
    pathname.startsWith('/planets')
  ) {
    return 'fractals';
  }
  if (pathname.startsWith('/projections')) return 'projections';
  if (pathname.startsWith('/graph')) return 'graph';
  if (pathname.startsWith('/realtime')) return 'realtime';
  if (pathname.startsWith('/issues')) return 'issues';
  return 'collections';
}

export function pageLabel(pathname: string): string {
  if (pathname.startsWith('/settings')) return 'Settings';
  const mode = shellModeFromPath(pathname);
  const nav = PRIMARY_NAV.find((item) => item.id === mode);
  if (mode === 'projections') {
    const projections = [
      { href: '/projections/list', label: 'Todos' },
      { href: '/projections/table', label: 'Cards' },
      { href: '/projections/kanban', label: 'Kanban' },
      { href: '/projections/calendar', label: 'Calendar' },
      { href: '/projections/gantt', label: 'Gantt' },
      { href: '/projections/dag', label: 'DAG' },
      { href: '/projections/json-ld', label: 'JSON-LD' },
      { href: '/projections/gallery', label: 'Gallery' },
    ];
    const match = projections.find(
      (d) => pathname === d.href || pathname.startsWith(`${d.href}/`),
    );
    if (match) return match.label;
    if (pathname === '/projections') return 'Projections';
  }
  if (mode === 'fractals') {
    if (pathname.startsWith('/grid')) return 'Collection';
    if (pathname.startsWith('/planets')) return 'Planets';
    return fractalRouteLabel(pathname);
  }
  if (pathname === '/collections/types') return 'Types';
  if (pathname.match(/^\/collections\/[^/]+/)) {
    const slug = pathname.split('/')[2];
    return slug ? slug.replace(/-/g, ' ') : 'Collection';
  }
  return nav?.label ?? 'Playground';
}
