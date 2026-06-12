'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { useCollection } from '@/lib/trellis/use-collection';
import { DagNode, type DagNodeT } from '@/lib/schemas/dag-node';
import { gridCardPalette } from '@/lib/projections/grid-palette';
import { BrowseProjectionShell } from '@/components/shell/browse-projection-shell';
import { ProjectionHeader } from '@/components/shell/ProjectionHeader';
import { CollectionViewHint } from '@/components/shell/CollectionViewHint';
import { AddRecordButton } from '@/components/shell/AddRecordButton';

type GraphNode = {
  id: string;
  title: string;
  colorIndex: number;
  layer: number;
  x: number;
  y: number;
};

type GraphLink = {
  source: string;
  target: string;
};

const NODE_WIDTH = 140;
const NODE_HEIGHT = 40;
const LAYER_GAP = 180;
const NODE_GAP = 56;

function resolveRef(rows: DagNodeT[], ref: string | undefined): string | null {
  if (!ref) return null;
  const match = rows.find((row) => row.id === ref || row.fixtureKey === ref);
  return match?.id ?? null;
}

function buildGraph(rows: DagNodeT[]): { nodes: GraphNode[]; links: GraphLink[] } {
  const links: GraphLink[] = [];
  const incoming = new Map<string, Set<string>>();

  for (const row of rows) {
    const parent = resolveRef(rows, row.parentId);
    if (parent && parent !== row.id) {
      links.push({ source: parent, target: row.id });
      incoming.set(row.id, (incoming.get(row.id) ?? new Set()).add(parent));
    }
    for (const dep of row.dependsOn ?? []) {
      const source = resolveRef(rows, dep);
      if (source && source !== row.id) {
        links.push({ source, target: row.id });
        incoming.set(row.id, (incoming.get(row.id) ?? new Set()).add(source));
      }
    }
  }

  const layers = new Map<string, number>();
  const visiting = new Set<string>();

  function layerFor(id: string): number {
    if (layers.has(id)) return layers.get(id)!;
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const preds = incoming.get(id);
    const depth = preds?.size
      ? Math.max(...[...preds].map((pred) => layerFor(pred) + 1))
      : 0;
    visiting.delete(id);
    layers.set(id, depth);
    return depth;
  }

  for (const row of rows) layerFor(row.id);

  const byLayer = new Map<number, DagNodeT[]>();
  for (const row of rows) {
    const layer = layers.get(row.id) ?? 0;
    const bucket = byLayer.get(layer) ?? [];
    bucket.push(row);
    byLayer.set(layer, bucket);
  }

  const nodes: GraphNode[] = [];
  for (const [layer, bucket] of [...byLayer.entries()].sort(([a], [b]) => a - b)) {
    bucket.forEach((row, index) => {
      nodes.push({
        id: row.id,
        title: row.title || 'Untitled',
        colorIndex: row.colorIndex ?? 0,
        layer,
        x: layer * LAYER_GAP + 80,
        y: index * (NODE_HEIGHT + NODE_GAP) + 60,
      });
    });
  }

  return { nodes, links };
}

export function DagBoard() {
  const { rows, mut } = useCollection(DagNode);
  const svgRef = useRef<SVGSVGElement>(null);
  const graph = useMemo(() => buildGraph(rows), [rows]);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const width = Math.max(720, ...graph.nodes.map((n) => n.x)) + NODE_WIDTH + 80;
    const height = Math.max(320, ...graph.nodes.map((n) => n.y)) + NODE_HEIGHT + 80;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const root = svg.append('g');
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 2.5])
      .on('zoom', (event) => {
        root.attr('transform', event.transform.toString());
      });
    svg.call(zoom);

    const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));

    root
      .append('g')
      .attr('fill', 'none')
      .attr('stroke', 'currentColor')
      .attr('stroke-opacity', 0.35)
      .selectAll('path')
      .data(graph.links)
      .join('path')
      .attr('d', (link) => {
        const source = nodeById.get(link.source);
        const target = nodeById.get(link.target);
        if (!source || !target) return '';
        const sx = source.x + NODE_WIDTH;
        const sy = source.y + NODE_HEIGHT / 2;
        const tx = target.x;
        const ty = target.y + NODE_HEIGHT / 2;
        const mx = (sx + tx) / 2;
        return `M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`;
      });

    const node = root
      .append('g')
      .selectAll('g')
      .data(graph.nodes)
      .join('g')
      .attr('transform', (d) => `translate(${d.x},${d.y})`);

    node
      .append('rect')
      .attr('width', NODE_WIDTH)
      .attr('height', NODE_HEIGHT)
      .attr('rx', 8)
      .attr('fill', (d) => gridCardPalette(d.colorIndex).background)
      .attr('stroke', (d) => gridCardPalette(d.colorIndex).border);

    node
      .append('text')
      .attr('x', NODE_WIDTH / 2)
      .attr('y', NODE_HEIGHT / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', (d) => gridCardPalette(d.colorIndex).foreground)
      .attr('font-size', 12)
      .text((d) => (d.title.length > 18 ? `${d.title.slice(0, 16)}…` : d.title));
  }, [graph]);

  async function addNode() {
    await mut.create({
      title: 'New node',
      dependsOn: [],
      colorIndex: rows.length % 16,
    });
  }

  return (
    <BrowseProjectionShell className="gap-4">
      <ProjectionHeader title="DAG">
        <CollectionViewHint schema={DagNode} current="dag" />
        <AddRecordButton label="New node" onClick={addNode} />
      </ProjectionHeader>

      <div className="overflow-hidden rounded-xl border border-border bg-card/40">
        {rows.length === 0 ? (
          <p className="p-8 text-sm text-muted-foreground">
            No nodes yet — seed fixtures with{' '}
            <code className="rounded bg-muted px-1 py-0.5">just seed-projections</code>.
          </p>
        ) : (
          <svg ref={svgRef} className="h-[420px] w-full text-foreground" role="img" aria-label="DAG graph" />
        )}
      </div>
    </BrowseProjectionShell>
  );
}
