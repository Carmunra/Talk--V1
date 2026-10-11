import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
// npm installs on one OS can accidentally omit bindings needed by other OSes.
// Check the lock before installation, so both developers and CI get a clear error.
for (const parent of ['@tailwindcss/oxide', 'lightningcss', 'rollup', 'esbuild']) {
  const metadata = lock.packages['node_modules/' + parent];
  assert(metadata, `Missing locked package: ${parent}`);
  for (const [name, version] of Object.entries(metadata.optionalDependencies || {})) {
    const locked = lock.packages['node_modules/' + name];
    const message = `Missing or incompatible native binding ${name}; regenerate the lock in a clean directory without node_modules`;
    assert(locked, message);
    if (/^\d+\.\d+\.\d+$/.test(version)) assert.equal(locked.version, version, message);
  }
}
console.log('Cross-platform native bindings verified in lockfile');
