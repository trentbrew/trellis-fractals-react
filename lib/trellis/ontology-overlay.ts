import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { TypeDef } from '@/lib/trellis/use-types';

export type OntologyOverlayStore = Record<string, TypeDef>;

export function readOntologyOverlay(path: string): OntologyOverlayStore {
  if (!existsSync(path)) return {};
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8')) as OntologyOverlayStore;
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

export function writeOntologyOverlay(path: string, store: OntologyOverlayStore): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
}
