import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AsaasGateway,
  AsaasSandboxGateway,
  cents,
  verifyAsaasWebhook,
} from '../../src/server/asaas';
import { readConfig } from '../../src/server/config';
import { account, wallet } from '../support/subscription-fixture';

test('Asaas requires environment-matched credentials and a distinct webhook token', () => {
  assert.equal(readConfig({}).asaasSandboxEnabled, false);
  const env = {
    ASAAS_SANDBOX_ENABLED: 'true',
    ASAAS_SANDBOX_API_KEY: '$aact_hmlg_test-key',
    ASAAS_SANDBOX_WEBHOOK_TOKEN: 't'.repeat(40),
    ASAAS_SANDBOX_ACCOUNT_ID: account,
  };
  assert.equal(readConfig(env).asaasSandboxEnabled, true);
  for (const invalid of [
    { NODE_ENV: 'production' },
    { ASAAS_SANDBOX_ENABLED: 'yes' },
    { ASAAS_SANDBOX_API_KEY: '' },
    { ASAAS_SANDBOX_WEBHOOK_TOKEN: 'short' },
    { ASAAS_SANDBOX_WEBHOOK_TOKEN: 't'.repeat(40), ASAAS_SANDBOX_API_KEY: 't'.repeat(40) },
    { ASAAS_SANDBOX_ACCOUNT_ID: 'invalid' },
  ])
    assert.throws(() => readConfig({ ...env, ...invalid }));
});

test('live subscriptions fail closed unless all approvals and an explicit credit policy are supplied', () => {
  const env = {
    APP_ORIGIN: 'https://talke.example',
    FIREBASE_PROJECT_ID: 'talke-production',
    LEGAL_APPROVED: 'true',
    SUBSCRIPTIONS_ENABLED: 'true',
    ASAAS_ENVIRONMENT: 'live',
    ASAAS_API_KEY: '$aact_prod_test-key',
    ASAAS_WEBHOOK_TOKEN: 't'.repeat(40),
    ASAAS_ACCOUNT_ID: account,
    PAYMENTS_HOMOLOGATED: 'true',
    ASAAS_PRODUCTION_APPROVED: 'true',
    SUBSCRIPTION_RULES_APPROVED: 'true',
    SUBSCRIPTION_CANCEL_CREDITS: 'keep_until_expiry',
  };
  assert.equal(readConfig(env).asaasEnvironment, 'live');
  assert.equal(
    readConfig({ ...env, SUBSCRIPTION_CANCEL_CREDITS: '60_days_after_cancel' })
      .subscriptionCancelCredits,
    '60_days_after_cancel',
  );
  for (const invalid of [
    { PAYMENTS_HOMOLOGATED: 'false' },
    { ASAAS_PRODUCTION_APPROVED: 'false' },
    { SUBSCRIPTION_RULES_APPROVED: 'false' },
    { SUBSCRIPTION_CANCEL_CREDITS: '' },
    { SUBSCRIPTION_CANCEL_CREDITS: 'invented' },
    { ASAAS_ENVIRONMENT: 'wrong' },
    { ASAAS_API_KEY: '$aact_hmlg_test-key' },
    { ASAAS_SANDBOX_ENABLED: 'true' },
    { LEGAL_APPROVED: 'false' },
    { APP_ORIGIN: 'http://localhost:3000' },
    { FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9099' },
    { FIRESTORE_EMULATOR_HOST: 'localhost:8080' },
    { FIREBASE_PROJECT_ID: 'demo-talke' },
    { SUBSCRIPTIONS_ENABLED: 'tru' },
  ])
    assert.throws(() => readConfig({ ...env, ...invalid }));
  const production = {
    ...env,
    NODE_ENV: 'production',
    LEGAL_NAME: 'Fixture',
    LEGAL_CNPJ: '12345678000190',
    PRIVACY_EMAIL: 'privacy@example.test',
    SUPPORT_EMAIL: 'support@example.test',
  };
  assert.doesNotThrow(() => readConfig(production));
  // Production-mode container can run Sandbox in isolated staging; hosting enforces the environment boundary.
  assert.doesNotThrow(() =>
    readConfig({
      ...production,
      ASAAS_ENVIRONMENT: 'sandbox',
      ASAAS_SANDBOX_API_KEY: '$aact_hmlg_test-key',
      ASAAS_SANDBOX_WEBHOOK_TOKEN: 's'.repeat(40),
      ASAAS_SANDBOX_ACCOUNT_ID: account,
    }),
  );
});

test('live adapter uses only fixed production origins and keeps card collection hosted', async () => {
  const gateway = new AsaasGateway(
    'private-test-key',
    true,
    async (url, options) => {
      assert.equal(String(url), 'https://api.asaas.com/v3/checkouts');
      assert.equal(options!.redirect, 'error');
      assert.equal(JSON.stringify(options!.body).includes('creditCard'), false);
      return new Response(JSON.stringify({ id: account }));
    },
    'live',
  );
  const result = await gateway.checkout(
    'monthly-4',
    'request_reference',
    'https://talke.example',
    '2026-10-12',
  );
  assert.equal(new URL(result.url).origin, 'https://asaas.com');
});
test('webhook comparison rejects empty, missing, short and forged tokens', () => {
  const secret = 't'.repeat(40);
  verifyAsaasWebhook(secret, secret);
  for (const token of ['', 't'.repeat(39), 'f'.repeat(40)])
    assert.throws(() => verifyAsaasWebhook(token, secret));
  assert.throws(() => verifyAsaasWebhook('', ''));
});
test('amounts use exact integer cents and reject fractional cents or unsafe values', () => {
  assert.equal(cents(1239), 123900);
  assert.equal(cents(40), 4000);
  for (const amount of [-1, NaN, Infinity, 0.001, Number.MAX_SAFE_INTEGER])
    assert.throws(() => cents(amount));
});
test('hosted recurring checkout uses approved catalog and never receives card data', async () => {
  let body: any;
  const gateway = new AsaasSandboxGateway('private-key', true, async (url, options) => {
    assert.equal(String(url), 'https://api-sandbox.asaas.com/v3/checkouts');
    assert.equal((options!.headers as any).access_token, 'private-key');
    assert.equal(options!.redirect, 'error');
    body = JSON.parse(String(options!.body));
    return new Response(JSON.stringify({ id: account }));
  });
  const result = await gateway.checkout(
    'monthly-16',
    'checkout_ref',
    'https://talke.club',
    '2026-10-11',
  );
  assert.equal(result.id, account);
  assert.equal(new URL(result.url).hostname, 'sandbox.asaas.com');
  assert.deepEqual(body.billingTypes, ['CREDIT_CARD']);
  assert.deepEqual(body.chargeTypes, ['RECURRENT']);
  assert.equal(body.items[0].value, 1239);
  assert.equal(body.subscription.cycle, 'MONTHLY');
  assert.equal(body.subscription.nextDueDate, '2026-10-11');
  assert.equal(body.externalReference, 'checkout_ref');
  assert.equal(body.callback.successUrl, 'https://talke.club/planos?checkout=retorno');
  assert.equal(JSON.stringify(body).includes('private-key'), false);
  assert.equal('creditCard' in body, false);
  await assert.rejects(() => gateway.checkout('forged', 'ref', 'https://talke.club', '2026-10-11'));
  await assert.rejects(() =>
    gateway.checkout('monthly-4', 'ref', 'https://talke.club/path', '2026-10-11'),
  );
  await assert.rejects(() =>
    gateway.checkout('monthly-4', 'ref', 'https://talke.club', '2026-02-30'),
  );
});
test('Asaas sandbox reads validate identifiers, strip sensitive fields, paginate and use no GET body', async () => {
  const seen: string[] = [];
  const gateway = new AsaasSandboxGateway('key', true, async (url, options) => {
    seen.push(String(url));
    if (options!.method === 'GET') assert.equal(options!.body, undefined);
    const path = new URL(String(url)).pathname;
    const payment = {
      id: 'pay_1',
      subscription: 'sub_1',
      customer: 'cus_1',
      value: 439,
      netValue: null,
      status: 'PENDING',
      dueDate: '2026-10-11',
      checkoutSession: account,
      creditCard: { number: 'sensitive' },
    };
    const row = path.endsWith('/balance')
      ? { balance: 100 }
      : path.endsWith('/cus_1')
        ? { id: 'cus_1', email: 'one@example.test', cpfCnpj: 'sensitive' }
        : path.endsWith('/sub_1')
          ? {
              id: 'sub_1',
              customer: 'cus_1',
              value: 439,
              cycle: 'MONTHLY',
              billingType: 'CREDIT_CARD',
              status: 'ACTIVE',
            }
          : path.endsWith('/pay_1')
            ? payment
            : path.endsWith('/transfer_1')
              ? {
                  id: 'transfer_1',
                  value: 40,
                  status: 'DONE',
                  externalReference: 'talke-one',
                  account: { walletId: wallet, name: 'sensitive' },
                }
              : path.endsWith('/payments')
                ? {
                    data: [payment],
                    hasMore: new URL(String(url)).searchParams.get('offset') === '0',
                  }
                : { deleted: true };
    return new Response(JSON.stringify(row));
  });
  assert.equal((await gateway.subscription('sub_1')).id, 'sub_1');
  assert.equal(JSON.stringify(await gateway.customer('cus_1')).includes('sensitive'), false);
  assert.equal(JSON.stringify(await gateway.payment('pay_1')).includes('sensitive'), false);
  assert.equal(await gateway.balance(), 10000);
  assert.equal((await gateway.transfer('transfer_1')).status, 'DONE');
  assert.equal((await gateway.checkoutPayments(account)).length, 2);
  assert.equal((await gateway.subscriptionPayments('sub_1')).length, 2);
  await gateway.cancelSubscription('sub_1');
  const before = seen.length;
  await assert.rejects(() => gateway.payment('../steal'));
  assert.equal(seen.length, before);
});
test('checkout reconciliation falls back to the creation window and rejects payments from another checkout', async () => {
  const seen: URL[] = [];
  const payment = {
    id: 'pay_1',
    subscription: 'sub_1',
    customer: 'cus_1',
    value: 439,
    netValue: 429.78,
    status: 'CONFIRMED',
    dueDate: '2026-10-12',
    checkoutSession: account,
  };
  const gateway = new AsaasSandboxGateway('key', true, async (url) => {
    const request = new URL(String(url));
    seen.push(request);
    if (request.searchParams.has('checkoutSession'))
      return new Response(
        JSON.stringify({
          data: [{ ...payment, id: 'pay_other', checkoutSession: wallet }],
          hasMore: false,
        }),
      );
    assert.equal(request.searchParams.get('dateCreated[ge]'), '2026-10-12');
    assert.equal(request.searchParams.get('dateCreated[le]'), '2026-10-13');
    const first = request.searchParams.get('offset') === '0';
    return new Response(
      JSON.stringify({
        data: first
          ? [{ id: 'unrelated', subscription: null }, payment]
          : [{ ...payment, id: 'pay_later', checkoutSession: wallet }],
        hasMore: first,
      }),
    );
  });
  const rows = await gateway.checkoutPayments(account, '2026-10-12');
  assert.deepEqual(
    rows.map((p) => p.id),
    ['pay_1'],
  );
  assert.equal(seen.length, 3);
  assert.equal(JSON.stringify(rows).includes('unrelated'), false);
  const before = seen.length;
  await assert.rejects(() => gateway.checkoutPayments(account, '2026-02-30'));
  assert.equal(seen.length, before);
});

test('checkout fallback refuses unbounded pagination instead of silently binding a partial result', async () => {
  let calls = 0;
  const gateway = new AsaasSandboxGateway('key', true, async (url) => {
    calls++;
    const query = new URL(String(url)).searchParams;
    return new Response(JSON.stringify({ data: [], hasMore: !query.has('checkoutSession') }));
  });
  await assert.rejects(() => gateway.checkoutPayments(account, '2026-10-12'), /excedeu o limite/);
  assert.equal(calls, 6);
});

test('provider failures are redacted, redirects forbidden and POST operations never automatically retried', async () => {
  let calls = 0;
  const gateway = new AsaasSandboxGateway('sensitive-key', true, async () => {
    calls++;
    throw new Error('sensitive-key and customer-card');
  });
  await assert.rejects(
    () => gateway.sendTransfer('ref', wallet, 4000),
    (error: any) => error.status === 502 && !error.message.includes('sensitive-key'),
  );
  assert.equal(calls, 1);
  await assert.rejects(() => gateway.sendTransfer('ref', wallet, 3999));
  assert.equal(calls, 1);
  await assert.rejects(() => new AsaasSandboxGateway('key', false).balance());
  await assert.rejects(() => new AsaasSandboxGateway('', true).balance());
  const rejected = new AsaasSandboxGateway(
    'key',
    true,
    async () => new Response('sensitive body', { status: 400 }),
  );
  await assert.rejects(() => rejected.balance(), /Asaas indisponível/);
});
test('transfer payload is exactly R$40 to the linked wallet, with a correlation reference', async () => {
  const gateway = new AsaasSandboxGateway('key', true, async (_url, options) => {
    const body = JSON.parse(String(options!.body));
    assert.deepEqual(body, { value: 40, walletId: wallet, externalReference: 'talke-ref' });
    return new Response(
      JSON.stringify({
        id: 'transfer_1',
        ...body,
        status: 'PENDING',
        account: { name: 'private receiver' },
      }),
    );
  });
  assert.equal((await gateway.sendTransfer('talke-ref', wallet, 4000)).status, 'PENDING');
});

test('pending transfer reads support nullable account without exposing receiver information', async () => {
  for (const accountData of [null, { name: 'private receiver' }]) {
    const gateway = new AsaasSandboxGateway(
      'key',
      true,
      async () =>
        new Response(
          JSON.stringify({
            id: 'transfer_1',
            value: 40,
            status: 'PENDING',
            externalReference: 'talke-ref',
            walletId: wallet,
            account: accountData,
          }),
        ),
    );
    const result = await gateway.transfer('transfer_1');
    assert.equal(result.walletId, wallet);
    assert.equal(result.status, 'PENDING');
    assert.equal(JSON.stringify(result).includes('private receiver'), false);
  }
});
