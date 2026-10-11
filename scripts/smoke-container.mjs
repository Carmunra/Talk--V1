import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';
const image = process.argv[2] || 'talke-ci:local';
const name = 'talke-ci-' + process.pid;
const docker = (args) => execFileSync('docker', args, { encoding: 'utf8', timeout: 30_000 }).trim();
const env = {
  APP_ORIGIN: 'https://container.example.test',
  FIREBASE_PROJECT_ID: 'container-test-project',
  LEGAL_NAME: 'Container test fixture',
  LEGAL_CNPJ: '12345678000190',
  PRIVACY_EMAIL: 'privacy@example.test',
  SUPPORT_EMAIL: 'support@example.test',
  LEGAL_APPROVED: 'true',
  GCE_METADATA_HOST: '127.0.0.1:9',
  PAYMENTS_ENABLED: 'false',
  MINORS_ENABLED: 'false',
};
try {
  docker([
    'run',
    '-d',
    '--name',
    name,
    '--read-only',
    '--cap-drop=ALL',
    '--security-opt=no-new-privileges',
    '-p',
    '127.0.0.1::3000',
    ...Object.entries(env).flatMap(([key, value]) => ['-e', key + '=' + value]),
    image,
  ]);
  const port = docker(['port', name, '3000/tcp']);
  const origin = 'http://' + port;
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      ready = (await fetch(origin + '/api/health', { signal: AbortSignal.timeout(1500) })).ok;
    } catch {}
    if (ready) break;
    await setTimeout(500);
  }
  assert(ready, 'Production container did not become healthy');
  const user = await fetch(origin + '/api/me');
  assert.equal(user.status, 401);
  const unknown = await fetch(origin + '/api/does-not-exist');
  // Authentication runs before private API routing, including unknown paths.
  assert.equal(unknown.status, 401);
  assert(unknown.headers.get('content-type').includes('application/json'));
  const page = await fetch(origin + '/');
  assert.equal(page.status, 200);
  assert(page.headers.get('content-security-policy').includes("frame-ancestors 'none'"));
  const inspect = JSON.parse(docker(['inspect', name]))[0];
  assert.equal(inspect.Config.User, 'node');
  assert.equal(inspect.HostConfig.ReadonlyRootfs, true);
  const forbidden = docker([
    'exec',
    name,
    'sh',
    '-c',
    'test ! -e /app/.env && test ! -d /app/tests && test ! -d /app/src && test ! -d /app/node_modules/typescript && echo runtime-only',
  ]);
  assert.equal(forbidden, 'runtime-only');
  console.log('Production container: nonroot, read-only, protected API and public assets verified');
} catch (error) {
  try {
    console.error(docker(['logs', name]));
  } catch {}
  throw error;
} finally {
  try {
    docker(['rm', '-f', name]);
  } catch {}
}
