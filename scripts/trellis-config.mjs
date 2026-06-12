import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadDeployConfig(configDir = '.') {
  const path = resolve(configDir, '.trellis-db.json');
  if (!existsSync(path)) return {};
  try {
    const cfg = JSON.parse(readFileSync(path, 'utf8'));
    return {
      url: typeof cfg.url === 'string' ? cfg.url : undefined,
      apiKey: typeof cfg.apiKey === 'string' ? cfg.apiKey : undefined,
    };
  } catch {
    return {};
  }
}

export function trellisEnv(configDir = '.') {
  const deploy = loadDeployConfig(configDir);
  const base = (process.env.TRELLIS_URL ?? deploy.url ?? 'http://localhost:8230').replace(
    /\/$/,
    '',
  );
  const apiKey = process.env.TRELLIS_API_KEY ?? deploy.apiKey;
  return { base, apiKey };
}

export function authHeaders(apiKey) {
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  return headers;
}
