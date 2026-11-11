import { test } from 'node:test';
import assert from 'node:assert/strict';
import { executeRelease, probeRelease, releaseConfig } from '../../scripts/release';
const sha = 'a'.repeat(40),
  digest = 'sha256:' + 'b'.repeat(64);
const previousImage = 'registry.example.test/old@sha256:' + 'c'.repeat(64);
const env = {
  GCP_PROJECT_ID: 'fixture-project',
  PEER_PROJECT_ID: 'fixture-production',
  GCP_REGION: 'southamerica-east1',
  CLOUD_RUN_SERVICE: 'talke',
  ARTIFACT_REPOSITORY: 'talke-images',
  APP_ORIGIN: 'https://fixture.example.test',
  GCP_WORKLOAD_IDENTITY_PROVIDER:
    'projects/123/locations/global/workloadIdentityPools/talke/providers/github',
  GCP_DEPLOY_SERVICE_ACCOUNT: 'deploy@fixture-project.iam.gserviceaccount.com',
  VITE_FIREBASE_API_KEY: 'public-fixture',
  VITE_FIREBASE_PROJECT_ID: 'fixture-project',
  VITE_FIREBASE_AUTH_DOMAIN: 'fixture-project.firebaseapp.com',
  VITE_FIREBASE_APP_ID: 'fixture-app',
  GITHUB_SHA: sha,
  GITHUB_RUN_ID: '123',
  GITHUB_REF: 'refs/heads/main',
  RELEASE_ENVIRONMENT: 'staging',
  RELEASE_APPROVED: 'true',
};
const config = releaseConfig(env);
const runtime = {
  NODE_ENV: 'production',
  FIREBASE_PROJECT_ID: 'fixture-project',
  APP_ORIGIN: env.APP_ORIGIN,
  LEGAL_NAME: 'Fixture company',
  LEGAL_CNPJ: '12345678000190',
  PRIVACY_EMAIL: 'privacy@example.test',
  SUPPORT_EMAIL: 'support@example.test',
  LEGAL_APPROVED: 'true',
  DAILY_DOMAIN: 'fixture',
  PAYMENTS_ENABLED: 'false',
};
function template(kind: string) {
  return {
    serviceAccountName: 'talke-' + kind + '@fixture-project.iam.gserviceaccount.com',
    containers: [
      {
        image: previousImage,
        env: [
          ...Object.entries(runtime).map(([name, value]) => ({ name, value })),
          { name: 'DAILY_API_KEY', valueFrom: { secretKeyRef: { name: 'daily-key', key: '1' } } },
        ],
      },
    ],
  };
}
function setup(failProbeAt = 0, failCommand = '') {
  const calls: string[][] = [],
    receipts: any[] = [];
  let descriptions = 0,
    probes = 0;
  const service = {
    spec: { template: { spec: template('web') } },
    status: { traffic: [{ percent: 100, revisionName: 'talke-old' }] },
  };
  const job = { spec: { template: { spec: { template: { spec: template('maintenance') } } } } };
  return {
    calls,
    receipts,
    service,
    job,
    deps: {
      record: async (receipt: Record<string, unknown>) => {
        receipts.push(receipt);
      },
      probe: async () => {
        if (++probes === failProbeAt) throw new Error('provider-secret-error');
      },
      run: async (command: string, args: string[]) => {
        calls.push([command, ...args]);
        if (failCommand && args.includes(failCommand)) throw new Error('provider-secret-error');
        if (args[0] === 'run' && args[1] === 'services' && args[2] === 'describe') {
          descriptions++;
          return JSON.stringify(
            descriptions === 1
              ? service
              : {
                  status: {
                    traffic: [
                      { percent: 100, revisionName: 'talke-old' },
                      {
                        percent: 0,
                        revisionName: 'talke-new',
                        tag: 'release-123',
                        url: 'https://candidate.run.app',
                      },
                    ],
                  },
                },
          );
        }
        if (args[0] === 'run' && args[1] === 'jobs' && args[2] === 'describe')
          return JSON.stringify(job);
        if (args[0] === 'artifacts') return digest;
        return '';
      },
    },
  };
}
test('release blocks wrong branch/project, missing approval and unvalidated production commit', () => {
  assert.throws(() => releaseConfig({ ...env, GITHUB_REF: 'refs/heads/feature' }));
  assert.throws(() => releaseConfig({ ...env, VITE_FIREBASE_PROJECT_ID: 'another-project' }));
  assert.throws(() => releaseConfig({ ...env, RELEASE_APPROVED: 'false' }));
  assert.throws(() => releaseConfig({ ...env, PEER_PROJECT_ID: env.GCP_PROJECT_ID }));
  assert.throws(() => releaseConfig({ ...env, RELEASE_ENVIRONMENT: 'production' }));
  assert.doesNotThrow(() =>
    releaseConfig({ ...env, RELEASE_ENVIRONMENT: 'production', STAGING_VALIDATED_SHA: sha }),
  );
});
test('release probes candidate before job update and traffic promotion, then writes sanitized receipt', async () => {
  const s = setup();
  const result = await executeRelease(config, s.deps);
  assert.equal(result.revision, 'talke-new');
  assert.match(result.image, /@sha256:[b]{64}$/);
  assert.equal(s.receipts.at(-1).status, 'SUCCEEDED');
  const updates = s.calls.filter(
    (call) => call.includes('update') || call.includes('update-traffic'),
  );
  assert(updates[0].includes('--no-traffic'));
  assert(updates[1].includes('jobs'));
  assert(updates[2].includes('--to-revisions=talke-new=100'));
  assert.equal(JSON.stringify(s.receipts).includes('DAILY_API_KEY'), false);
  assert.equal(JSON.stringify(s.receipts).includes('Fixture company'), false);
});
test('failed candidate probe never updates the job or promotes traffic', async () => {
  const s = setup(1);
  await assert.rejects(executeRelease(config, s.deps), /preservados ou restaurados/);
  assert.equal(
    s.calls.some((call) => call.includes('jobs') && call.includes('update')),
    false,
  );
  assert.equal(
    s.calls.some((call) => call.some((arg) => arg.startsWith('--to-revisions='))),
    false,
  );
  assert.equal(s.receipts.at(-1).status, 'FAILED_RESTORED');
});

test('Google Meet release accepts no Daily secret while keeping service and maintenance configuration aligned', async () => {
  const s = setup();
  for (const template of [s.service.spec.template.spec, s.job.spec.template.spec.template.spec]) {
    template.containers[0].env = template.containers[0].env.filter(
      (entry: any) => !entry.name.startsWith('DAILY_'),
    );
    template.containers[0].env.push({ name: 'VIDEO_PROVIDER', value: 'google_meet' } as any);
  }
  const result = await executeRelease(config, s.deps);
  assert.equal(result.revision, 'talke-new');
  assert.equal(s.receipts.at(-1).status, 'SUCCEEDED');
});
test('post-promotion failure restores stable traffic and previous maintenance image', async () => {
  const s = setup(2);
  await assert.rejects(executeRelease(config, s.deps), /preservados ou restaurados/);
  assert(s.calls.some((call) => call.includes('--to-revisions=talke-old=100')));
  assert(
    s.calls.some((call) => call.includes('jobs') && call.includes('--image=' + previousImage)),
  );
  assert.equal(s.receipts.at(-1).status, 'FAILED_RESTORED');
  assert.equal(JSON.stringify(s.receipts).includes('provider-secret-error'), false);
});
test('partial job-update failure attempts restoration and signals failed recovery explicitly', async () => {
  const s = setup(0, '--image=' + previousImage);
  const original = s.deps.run;
  s.deps.run = async (command, args) => {
    if (
      args.includes('jobs') &&
      args.includes('update') &&
      !args.includes('--image=' + previousImage)
    ) {
      s.calls.push([command, ...args]);
      throw new Error('partially-updated');
    }
    return original(command, args);
  };
  await assert.rejects(executeRelease(config, s.deps), /intervenção operacional obrigatória/);
  assert(s.calls.some((call) => call.includes('--image=' + previousImage)));
  assert.equal(s.receipts.at(-1).status, 'RECOVERY_REQUIRED');
});
test('runtime mismatch or plaintext secret is refused before building remote resources', async () => {
  for (const change of [
    { name: 'APP_ORIGIN', value: 'https://wrong.example.test' },
    { name: 'DAILY_API_KEY', value: 'do-not-log-me' },
    { name: 'ASAAS_API_KEY', value: 'do-not-log-me' },
    { name: 'ASAAS_SANDBOX_WEBHOOK_TOKEN', value: 'do-not-log-me' },
  ]) {
    const s = setup();
    s.service.spec.template.spec.containers[0].env.push(change);
    await assert.rejects(executeRelease(config, s.deps));
    assert.equal(
      s.calls.some((call) => call.includes('push') || call.includes('update')),
      false,
    );
  }
});
test('remote probe requires real database readiness, CSP and unauthenticated API rejection', async () => {
  const request = async (url: string | URL | Request) => {
    const path = new URL(String(url)).pathname;
    if (path === '/')
      return new Response('html', {
        headers: { 'Content-Security-Policy': "frame-ancestors 'none'" },
      });
    if (path === '/api/me')
      return new Response('{}', { status: 401, headers: { 'Cache-Control': 'no-store' } });
    return Response.json({ status: path === '/api/health' ? 'ok' : 'ready' });
  };
  await probeRelease(env.APP_ORIGIN, request as typeof fetch);
  await assert.rejects(
    probeRelease(env.APP_ORIGIN, (async () => new Response('', { status: 503 })) as typeof fetch),
  );
});
