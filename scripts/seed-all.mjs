#!/usr/bin/env node
/** Run all remote/local seed scripts in order (idempotent). */
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scripts = [
  'register-collection-ontology.mjs',
  'seed-projection-fixtures.mjs',
  'seed-collections.mjs',
];

for (const script of scripts) {
  console.log(`→ ${script}`);
  await new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [resolve(root, 'scripts', script)], {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${script} exited ${code}`));
    });
  });
}

console.log('Seed complete');
