export type EntityPresentation = 'dot' | 'chip' | 'row' | 'card' | 'panel' | 'page';

export const ENTITY_PRESENTATION_LABELS: Record<EntityPresentation, string> = {
  dot: 'Dot',
  chip: 'Chip',
  row: 'Row',
  card: 'Card',
  panel: 'Panel',
  page: 'Page',
};

export function resolveEntityPresentation(vantage: number): EntityPresentation {
  if (vantage <= 2) return 'dot';
  if (vantage < 4) return 'chip';
  if (vantage < 6) return 'row';
  if (vantage < 8) return 'card';
  if (vantage < 11) return 'panel';
  return 'page';
}

export function entityStageMaxWidth(vantage: number): string {
  if (vantage <= 2) return '6rem';
  if (vantage < 4) return '18rem';
  if (vantage < 6) return '42rem';
  if (vantage < 8) return '32rem';
  if (vantage < 11) return '48rem';
  return '68rem';
}
