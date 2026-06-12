export type FractalRoute = {
  id: 'entity' | 'collection' | 'page' | 'app';
  label: string;
  href: string;
  description: string;
  status: 'live' | 'stub';
};

export const FRACTAL_ROUTES: FractalRoute[] = [
  {
    id: 'entity',
    label: 'Entity',
    href: '/fractals/entity',
    description: 'One record from dot to full detail.',
    status: 'live',
  },
  {
    id: 'collection',
    label: 'Collection',
    href: '/fractals/collection',
    description: 'One live collection across graph, table, list, and grid.',
    status: 'live',
  },
  {
    id: 'page',
    label: 'Page',
    href: '/fractals/page',
    description: 'A page as graph node, outline, and layout with graph-derived sidebar.',
    status: 'live',
  },
  {
    id: 'app',
    label: 'App',
    href: '/fractals/app',
    description: 'The product shell as a representable object.',
    status: 'stub',
  },
];

export function fractalRouteLabel(pathname: string): string {
  const match = FRACTAL_ROUTES.find(
    (route) => pathname === route.href || pathname.startsWith(`${route.href}/`),
  );
  return match?.label ?? 'Fractals';
}
