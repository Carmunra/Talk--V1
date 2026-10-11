import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const entries = await readdir('dist/client', { recursive: true });
assert(
  !entries.some((path) => String(path).endsWith('.map') || String(path).includes('server')),
  'Server or source map exposed in client assets',
);
const client = await Promise.all(
  entries
    .filter((path) => String(path).endsWith('.js'))
    .map((path) => readFile('dist/client/' + path, 'utf8')),
);
for (const content of client) {
  assert(
    !content.includes('Entrar no emulador') && !content.includes('/_test/reset'),
    'Test helpers included in production client',
  );
  assert(
    !content.includes('MP_CLIENT_SECRET') &&
      !content.includes('TOKEN_ENCRYPTION_KEY') &&
      !content.includes('ASAAS_SANDBOX_API_KEY') &&
      !content.includes('ASAAS_SANDBOX_WEBHOOK_TOKEN'),
    'Server secrets/config included in browser code',
  );
}
const server = await readFile('dist/server/index.js', 'utf8');
assert(
  !server.includes('replaceForTest') &&
    !server.includes('/_test/approve') &&
    !server.includes('/_test/subscriptions'),
  'Test adapters included in production server',
);
console.log('Client/server separation verified');
