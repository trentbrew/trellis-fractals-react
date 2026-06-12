#!/usr/bin/env node
/**
 * Sprites deploy smoke — stub or live. Run from playground-next root.
 */
import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const configPath = resolve(root, '.trellis-db.json');

const positional = process.argv.slice(2).filter((arg) => arg !== '--stub' && arg !== '--');
const name = positional[0] ?? `playground-next-${Date.now().toString(36).slice(-6)}`;
const stub = process.argv.includes('--stub');
const trellisNode = resolve(
  process.env.TRELLIS_NODE_ROOT ??
    '/Users/trentbrew/TURTLE/Projects/TRELLIS/trellis-node',
);

async function runTrellisDeploy() {
  const args = [
    'tsx',
    'src/cli/index.ts',
    'deploy',
    '--name',
    name,
    '--config-dir',
    root,
  ];
  if (stub) args.push('--stub');

  return new Promise((resolvePromise, reject) => {
    const child = spawn('npx', args, {
      cwd: trellisNode,
      stdio: 'inherit',
      env: { ...process.env, TRELLIS_NODE_ROOT: trellisNode },
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`trellis deploy exited ${code}`));
    });
  });
}

async function healthCheck(url) {
  const res = await fetch(`${url.replace(/\/$/, '')}/health`);
  const text = await res.text();
  console.log(`Health ${res.status}: ${text}`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
}

async function main() {
  console.log(`Smoke deploy: name=${name} stub=${stub}`);
  console.log(`Trellis source: ${trellisNode}`);

  await runTrellisDeploy();

  if (!existsSync(configPath)) {
    throw new Error(`Missing ${configPath}`);
  }

  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  console.log('Config written:', { url: config.url, spriteName: config.spriteName });

  if (!stub && config.url) {
    await healthCheck(config.url);
  }

  console.log('Smoke deploy OK');
}

main().catch((err) => {
  console.error('Smoke deploy failed:', err.message ?? err);
  process.exit(1);
});
