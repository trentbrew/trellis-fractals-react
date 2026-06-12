'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import {
  buildForceGraphLinks,
  materializeForceGraphLinks,
  type ForceGraphLink,
  type ForceGraphNodeInput,
} from '@/lib/fractal/force-graph';
import { gridCardPalette } from '@/lib/projections/grid-palette';

type SimNode = ForceGraphNodeInput & {
  x: number;
  y: number;
};

type SimLink = d3.SimulationLinkDatum<SimNode>;

const WIDTH = 960;
const HEIGHT = 420;
const VIEW_PADDING = 48;

function createSimulation(nodes: SimNode[], links: SimLink[]) {
  const spread = Math.max(1, Math.sqrt(nodes.length));
  return d3
    .forceSimulation(nodes)
    .force(
      'link',
      d3
        .forceLink(links)
        .id((node) => (node as SimNode).id)
        .distance(88 + spread * 8)
        .strength(0.9),
    )
    .force('charge', d3.forceManyBody().strength(-140 - spread * 16))
    .force('center', d3.forceCenter(WIDTH / 2, HEIGHT / 2).strength(0.55))
    .force('x', d3.forceX(WIDTH / 2).strength(0.04))
    .force('y', d3.forceY(HEIGHT / 2).strength(0.04))
    .force('collision', d3.forceCollide(22 + spread * 2));
}

function settleSimulation(simulation: d3.Simulation<SimNode, SimLink>) {
  simulation.alpha(1);
  for (let tick = 0; tick < 320 && simulation.alpha() > 0.02; tick += 1) {
    simulation.tick();
  }
  simulation.stop();
}

function fitViewBox(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, nodes: SimNode[]) {
  if (nodes.length === 0) return;

  const xs = nodes.map((node) => node.x);
  const ys = nodes.map((node) => node.y);
  const minX = Math.min(...xs) - VIEW_PADDING;
  const minY = Math.min(...ys) - VIEW_PADDING;
  const maxX = Math.max(...xs) + VIEW_PADDING;
  const maxY = Math.max(...ys) + VIEW_PADDING;

  svg.attr(
    'viewBox',
    `${minX} ${minY} ${Math.max(WIDTH / 4, maxX - minX)} ${Math.max(HEIGHT / 4, maxY - minY)}`,
  );
}

function paintGraph(
  link: d3.Selection<SVGLineElement, SimLink, SVGGElement, unknown>,
  node: d3.Selection<SVGGElement, SimNode, SVGGElement, unknown>,
  nodeOf: (endpoint: string | number | SimNode) => SimNode,
) {
  link
    .attr('x1', (item) => nodeOf(item.source).x)
    .attr('y1', (item) => nodeOf(item.source).y)
    .attr('x2', (item) => nodeOf(item.target).x)
    .attr('y2', (item) => nodeOf(item.target).y);

  node.attr('transform', (item) => `translate(${item.x},${item.y})`);
}

export function ForceGraphCanvas({
  nodes: nodeInputs,
  links: linkInputs,
  focusId,
  nodeDataAttribute,
  ariaLabel,
  testId,
  emptyMessage,
  inferLinks,
  onSelect,
  onContextMenu,
}: {
  nodes: ForceGraphNodeInput[];
  links?: ForceGraphLink[];
  focusId?: string;
  nodeDataAttribute: string;
  ariaLabel: string;
  testId: string;
  emptyMessage: string;
  inferLinks?: (nodes: ForceGraphNodeInput[]) => ForceGraphLink[];
  onSelect?: (id: string) => void;
  onContextMenu?: (event: React.MouseEvent<SVGSVGElement>, id: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || nodeInputs.length === 0) return;

    const nodes: SimNode[] = nodeInputs.map((node) => ({
      ...node,
      x: WIDTH / 2,
      y: HEIGHT / 2,
    }));
    const nodeIds = new Set(nodes.map((node) => node.id));
    const rawLinks = linkInputs ?? buildForceGraphLinks(nodeInputs, inferLinks);
    const links: SimLink[] = materializeForceGraphLinks(rawLinks, nodeIds);
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const nodeOf = (endpoint: string | number | SimNode) => {
      if (typeof endpoint === 'object') return endpoint;
      if (typeof endpoint === 'number') return nodes[endpoint];
      return nodeById.get(String(endpoint))!;
    };

    const simulation = createSimulation(nodes, links);

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);

    const root = svg.append('g');

    const linkLayer = root
      .append('g')
      .attr('class', 'links')
      .attr('stroke', 'currentColor')
      .attr('stroke-opacity', 0.2);

    const nodeLayer = root.append('g').attr('class', 'nodes');

    const link = linkLayer
      .selectAll<SVGLineElement, SimLink>('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 1.5);

    const node = nodeLayer
      .selectAll<SVGGElement, SimNode>('g')
      .data(nodes, (item) => item.id)
      .join('g')
      .attr(nodeDataAttribute, (item) => item.id)
      .attr('cursor', onSelectRef.current ? 'pointer' : null)
      .on('click', (_event, item) => onSelectRef.current?.(item.id));

    node
      .append('circle')
      .attr('r', (item) => (item.id === focusId ? 12 : 9))
      .attr('fill', (item) => gridCardPalette(item.colorIndex ?? 0).background)
      .attr('stroke', (item) =>
        item.id === focusId
          ? 'var(--foreground)'
          : gridCardPalette(item.colorIndex ?? 0).foreground,
      )
      .attr('stroke-width', (item) => (item.id === focusId ? 2.5 : 1.5))
      .attr('vector-effect', 'non-scaling-stroke');

    node.append('title').text((item) => item.title);

    node
      .append('text')
      .attr('y', 22)
      .attr('text-anchor', 'middle')
      .attr('fill', 'currentColor')
      .attr('font-size', 11)
      .text((item) => item.title);

    settleSimulation(simulation);
    paintGraph(link, node, nodeOf);
    fitViewBox(svg, nodes);

    return () => {
      simulation.stop();
    };
  }, [focusId, inferLinks, linkInputs, nodeDataAttribute, nodeInputs]);

  return (
    <div
      className="min-h-72 overflow-hidden rounded-lg border border-border bg-card/35"
      data-testid={testId}
    >
      {nodeInputs.length === 0 ? (
        <p className="p-8 text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <svg
          ref={svgRef}
          className="h-[420px] w-full text-foreground"
          role="img"
          aria-label={ariaLabel}
          onContextMenu={
            onContextMenu
              ? (event) => {
                  const target = event.target as SVGElement;
                  const group = target.closest<SVGGElement>(`g[${nodeDataAttribute}]`);
                  const id = group?.getAttribute(nodeDataAttribute) ?? undefined;
                  if (id) onContextMenu(event, id);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
