import { test } from 'node:test';
import assert from 'node:assert/strict';
import { preflight } from '../../src/server/preflight';
import { readConfig } from '../../src/server/config';
const env = {
  APP_ORIGIN: 'https://talke.example',
  FIREBASE_PROJECT_ID: 'test-project',
  LEGAL_NAME: 'Test fixture',
  LEGAL_CNPJ: '12345678000190',
  PRIVACY_EMAIL: 'privacy@example.test',
  SUPPORT_EMAIL: 'support@example.test',
  LEGAL_APPROVED: 'true',
  VITE_FIREBASE_API_KEY: 'public-test-key',
  VITE_FIREBASE_PROJECT_ID: 'test-project',
  VITE_FIREBASE_AUTH_DOMAIN: 'test-project.firebaseapp.com',
  VITE_FIREBASE_APP_ID: 'test-app',
  DAILY_API_KEY: 'test-secret',
  DAILY_DOMAIN: 'test-domain',
};
test('monthly launch separately checks the approved product, minors and real billing', () => {
  const report = preflight(env, true);
  assert.equal(report.ready, false);
  assert(report.issues.includes('Contratação mensal desabilitada'));
  assert(report.issues.includes('Procedimentos de proteção de menores pendentes'));
  const complete = {
    ...env,
    SUBSCRIPTIONS_ENABLED: 'true',
    ASAAS_ENVIRONMENT: 'live',
    ASAAS_API_KEY: '$aact_prod_fixture',
    ASAAS_WEBHOOK_TOKEN: 's'.repeat(40),
    ASAAS_ACCOUNT_ID: 'ce40c7b4-28d8-4125-bcd5-3c5d00406615',
    PAYMENTS_HOMOLOGATED: 'true',
    ASAAS_PRODUCTION_APPROVED: 'true',
    SUBSCRIPTION_RULES_APPROVED: 'true',
    SUBSCRIPTION_CANCEL_CREDITS: 'keep_until_expiry',
    MINORS_ENABLED: 'true',
    MINIMUM_AGE: '6',
    MINORS_SAFEGUARDS_APPROVED: 'true',
  };
  assert.equal(preflight(complete, true).ready, true);
  assert.equal(
    JSON.stringify(preflight({ ...complete, LEGAL_APPROVED: 'false' }, true)).includes(
      complete.ASAAS_API_KEY,
    ),
    false,
  );
});
test('preflight blocks incomplete or mismatched publication without exposing secrets', () => {
  assert.equal(preflight(env).ready, true);
  assert.equal(preflight({ ...env, LEGAL_APPROVED: 'false' }).ready, false);
  assert.equal(preflight({ ...env, VITE_FIREBASE_PROJECT_ID: 'other-project' }).ready, false);
  assert.equal(preflight({ ...env, DAILY_API_KEY: '' }).ready, false);
  assert.equal(
    preflight({
      ...env,
      FIREBASE_PROJECT_ID: 'demo-project',
      VITE_FIREBASE_PROJECT_ID: 'demo-project',
    }).ready,
    false,
  );
  assert.equal(
    JSON.stringify(preflight({ ...env, LEGAL_APPROVED: 'false' })).includes('test-secret'),
    false,
  );
});
test('invalid origins and configuration typos fail before connecting external services', () => {
  for (const origin of [
    'https://talke.example/',
    'https://talke.example/path',
    'https://user:pass@talke.example',
    'ftp://talke.example',
  ])
    assert.throws(() => readConfig({ ...env, APP_ORIGIN: origin }));
  assert.throws(() => readConfig({ ...env, PAYMENTS_ENABLED: 'tru' }));
  assert.throws(() => readConfig({ ...env, MP_ENVIRONMENT: 'lve' }));
});
test('live payment gates apply in development too and reject emulators', () => {
  const live = { ...env, PAYMENTS_ENABLED: 'true', MP_ENVIRONMENT: 'live' };
  assert.throws(() => readConfig(live));
  assert.doesNotThrow(() => readConfig({ ...live, PAYMENTS_HOMOLOGATED: 'true' }));
  assert.throws(() =>
    readConfig({
      ...live,
      PAYMENTS_HOMOLOGATED: 'true',
      FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9099',
    }),
  );
});
