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

/**
 * Persist the overlay, tolerating read-only/serverless filesystems (e.g. Vercel,
 * where only `/tmp` is writable). The upstream Trellis node is the durable store
 * for schema; a failed local overlay write must degrade, not 500 the request.
 *
 * @returns whether the overlay was actually written to disk.
 */
export function writeOntologyOverlay(path: string, store: OntologyOverlayStore): boolean {
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
    return true;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    // Read-only / permission-denied filesystem: skip silently, the sidecar holds truth.
    if (code === 'EROFS' || code === 'EACCES' || code === 'EPERM') {
      return false;
    }
    throw err;
  }
}
