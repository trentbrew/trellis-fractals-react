import type { CardT } from '@/lib/schemas/card';

export type ForceGraphLink = {
  source: string;
  target: string;
};

type ForceGraphLinkEndpoint = string | { id: string };

/** D3 forceLink mutates link endpoints in place — always clone before simulation. */
export function materializeForceGraphLinks(
  links: Array<{ source: ForceGraphLinkEndpoint; target: ForceGraphLinkEndpoint }>,
  nodeIds: ReadonlySet<string>,
): ForceGraphLink[] {
  const materialized: ForceGraphLink[] = [];

  for (const link of links) {
    const source = typeof link.source === 'string' ? link.source : link.source.id;
    const target = typeof link.target === 'string' ? link.target : link.target.id;
    if (source === target || !nodeIds.has(source) || !nodeIds.has(target)) continue;
    materialized.push({ source, target });
  }

  return materialized;
}

export type ForceGraphNodeInput = {
  id: string;
  title: string;
  colorIndex: number;
  relatedIds?: string[];
};

export function uniqueLinksFromRelatedIds(
  items: ForceGraphNodeInput[],
): ForceGraphLink[] {
  const ids = new Set(items.map((item) => item.id));
  const seen = new Set<string>();
  const links: ForceGraphLink[] = [];

  for (const item of items) {
    for (const targetId of item.relatedIds ?? []) {
      if (!ids.has(targetId)) continue;
      const key = [item.id, targetId].sort().join('::');
      if (seen.has(key)) continue;
      seen.add(key);
      links.push({ source: item.id, target: targetId });
    }
  }

  return links;
}

function cardsShareEdge(
  a: Pick<CardT, 'brand' | 'category' | 'tags'>,
  b: Pick<CardT, 'brand' | 'category' | 'tags'>,
): boolean {
  if (a.brand && b.brand && a.brand === b.brand) return true;
  if (a.category && b.category && a.category === b.category) return true;
  const tagsA = new Set(a.tags ?? []);
  return (b.tags ?? []).some((tag) => tagsA.has(tag));
}

export function inferCardGraphLinks(
  cards: Pick<CardT, 'id' | 'brand' | 'category' | 'tags'>[],
): ForceGraphLink[] {
  const seen = new Set<string>();
  const links: ForceGraphLink[] = [];

  for (let left = 0; left < cards.length; left += 1) {
    for (let right = left + 1; right < cards.length; right += 1) {
      const a = cards[left];
      const b = cards[right];
      if (!cardsShareEdge(a, b)) continue;
      const key = [a.id, b.id].sort().join('::');
      if (seen.has(key)) continue;
      seen.add(key);
      links.push({ source: a.id, target: b.id });
    }
  }

  return links;
}

export function buildForceGraphLinks(
  nodes: ForceGraphNodeInput[],
  inferLinks?: (nodes: ForceGraphNodeInput[]) => ForceGraphLink[],
): ForceGraphLink[] {
  const hasExplicit = nodes.some((node) => (node.relatedIds?.length ?? 0) > 0);
  if (hasExplicit) return uniqueLinksFromRelatedIds(nodes);
  return inferLinks?.(nodes) ?? [];
}
