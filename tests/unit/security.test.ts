import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { seal, unseal, verifyWebhook } from '../../src/server/security';
import { readConfig } from '../../src/server/config';
test('support contacts reject invalid addresses and retain backward-compatible primary contact', () => {
  assert.deepEqual(readConfig({}).supportEmails, []);
  const config = readConfig({
    SUPPORT_EMAIL: 'support@example.test',
    SUPPORT_EMAIL_SECONDARY: 'alternate@example.test',
  });
  assert.equal(config.supportEmail, 'support@example.test');
  assert.deepEqual(config.supportEmails, ['support@example.test', 'alternate@example.test']);
  assert.deepEqual(
    readConfig({
      SUPPORT_EMAIL: 'support@example.test',
      SUPPORT_EMAIL_SECONDARY: 'support@example.test',
    }).supportEmails,
    ['support@example.test'],
  );
  assert.throws(() => readConfig({ SUPPORT_EMAIL_SECONDARY: 'invalid' }));
});
test('seller credentials are encrypted with integrity and cannot be decrypted under another key', () => {
  const key = Buffer.alloc(32, 1).toString('base64'),
    sealed = seal({ access_token: 'secret' }, key);
  assert.equal(sealed.includes('secret'), false);
  assert.deepEqual(unseal(sealed, key), { access_token: 'secret' });
  assert.throws(() => unseal(sealed, Buffer.alloc(32, 2).toString('base64')));
  assert.throws(() => seal('secret', 'bad'));
  const bytes = Buffer.from(sealed, 'base64');
  bytes[bytes.length - 1] ^= 1;
  assert.throws(() => unseal(bytes.toString('base64'), key));
});
test('webhook signature protects payment id and enforces timestamp tolerance', () => {
  const now = Date.now(),
    ts = String(Math.floor(now / 1000)),
    secret = 'secret';
  const hash = createHmac('sha256', secret)
    .update('id:abc;request-id:request;ts:' + ts + ';')
    .digest('hex');
  assert.doesNotThrow(() =>
    verifyWebhook('ts=' + ts + ',v1=' + hash, 'request', 'ABC', secret, now),
  );
  assert.throws(() => verifyWebhook('ts=' + ts + ',v1=' + hash, 'other', 'ABC', secret, now));
  assert.throws(() =>
    verifyWebhook('ts=' + ts + ',v1=' + hash, 'request', 'ABC', secret, now + 10 * 60_000),
  );
  assert.throws(() => verifyWebhook('ts=' + ts + ',v1=bad', 'request', 'ABC', secret, now));
});
test('production cannot start with missing legal identity, emulator or payment secrets', () => {
  assert.throws(() => readConfig({ NODE_ENV: 'production' }));
  const env = {
    NODE_ENV: 'production',
    APP_ORIGIN: 'https://talke.example',
    FIREBASE_PROJECT_ID: 'live-project',
    LEGAL_NAME: 'Company',
    LEGAL_CNPJ: '12345678000190',
    PRIVACY_EMAIL: 'privacy@example.com',
    SUPPORT_EMAIL: 'help@example.com',
    LEGAL_APPROVED: 'true',
  };
  assert.doesNotThrow(() => readConfig(env));
  assert.throws(() => readConfig({ ...env, FIRESTORE_EMULATOR_HOST: 'localhost:8080' }));
  assert.throws(() => readConfig({ ...env, PAYMENTS_ENABLED: 'true' }));
  assert.throws(() => readConfig({ ...env, APP_ORIGIN: 'http://talke.example' }));
});
