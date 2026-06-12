export type PageProjection = 'graph' | 'outline' | 'layout';

export const PAGE_PROJECTION_LABELS: Record<PageProjection, string> = {
  graph: 'Page graph',
  outline: 'Outline',
  layout: 'Layout',
};

export function resolvePageProjection(vantage: number): PageProjection {
  if (vantage <= 3) return 'graph';
  if (vantage < 8) return 'outline';
  return 'layout';
}
