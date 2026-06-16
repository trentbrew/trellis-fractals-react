import type { LucideIcon } from 'lucide-react';
import {
  DatabaseIcon,
  GitBranchIcon,
  NetworkIcon,
  PanelsTopLeftIcon,
  WaypointsIcon,
} from 'lucide-react';
import { DEMO_SURFACE_DEFAULT_HREF, DEMO_SURFACE_NAV, HIDDEN_PROJECTION_DEMOS } from '@/lib/shell/demo-nav';
import { fractalRouteLabel } from '@/lib/shell/fractals';

export type ShellMode =
  | 'collections'
  | 'fractals'
  | 'graph'
  | 'issues'
  | 'projections';

const SHELL_MODES = new Set<string>([
  'collections',
  'fractals',
  'graph',
  'issues',
  'projections',
]);

export function isShellMode(id: string): id is ShellMode {
  return SHELL_MODES.has(id);
}

export type PrimaryNavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  enabled?: boolean;
};

export const PRIMARY_NAV: PrimaryNavItem[] = [
  { id: 'projections', label: 'Social', href: DEMO_SURFACE_DEFAULT_HREF, icon: PanelsTopLeftIcon },
  { id: 'collections', label: 'Collections', href: '/collections', icon: DatabaseIcon },
  { id: 'fractals', label: 'Fractals', href: '/fractals', icon: WaypointsIcon, enabled: false },
  { id: 'graph', label: 'Graph', href: '/graph', icon: NetworkIcon, enabled: false },
  { id: 'issues', label: 'Issues', href: '/issues', icon: GitBranchIcon, enabled: false },
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
  if (pathname.startsWith('/projections') || pathname.startsWith('/realtime')) {
    return 'projections';
  }
  if (pathname.startsWith('/graph')) return 'graph';
  if (pathname.startsWith('/issues')) return 'issues';
  return 'projections';
}

export function pageLabel(pathname: string): string {
  if (pathname.startsWith('/settings')) return 'Settings';
  const mode = shellModeFromPath(pathname);
  const nav = PRIMARY_NAV.find((item) => item.id === mode);
  if (mode === 'projections') {
    const match = DEMO_SURFACE_NAV.find(
      (d) => pathname === d.href || pathname.startsWith(`${d.href}/`),
    );
    if (match) return match.label;
    const hidden = HIDDEN_PROJECTION_DEMOS.find(
      (d) => pathname === d.href || pathname.startsWith(`${d.href}/`),
    );
    if (hidden) return hidden.label;
    if (pathname === '/projections' || pathname.startsWith('/realtime')) return 'Social';
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
