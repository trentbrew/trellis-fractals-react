import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export type TrellisServerConfig = {
  origin: string;
  apiKey?: string;
  dbPath?: string;
};

function loadDbJson(cwd: string): Partial<TrellisServerConfig> {
  const path = resolve(cwd, '.trellis-db.json');
  if (!existsSync(path)) return {};
  try {
    const cfg = JSON.parse(readFileSync(path, 'utf8')) as {
      url?: string;
      apiKey?: string;
      dbPath?: string;
    };
    return {
      origin: typeof cfg.url === 'string' ? cfg.url.replace(/\/$/, '') : undefined,
      apiKey: typeof cfg.apiKey === 'string' ? cfg.apiKey : undefined,
      dbPath: typeof cfg.dbPath === 'string' ? cfg.dbPath : undefined,
    };
  } catch {
    return {};
  }
}

export function trellisServerConfig(cwd = process.cwd()): TrellisServerConfig {
  const file = loadDbJson(cwd);
  const origin = (
    process.env.TRELLIS_URL ??
    process.env.NEXT_PUBLIC_TRELLIS_URL ??
    file.origin ??
    'http://localhost:8230'
  ).replace(/\/$/, '');

  const apiKey = process.env.TRELLIS_API_KEY ?? file.apiKey;
  const dbPath = file.dbPath ?? resolve(cwd, '.trellis-db');

  return { origin, apiKey, dbPath };
}

export function trellisAuthHeaders(apiKey?: string): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  return headers;
}

export function ontologyOverlayPath(dbPath: string): string {
  return join(dbPath, 'ontology-overlays.json');
}
