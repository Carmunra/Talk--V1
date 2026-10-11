import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MercadoPagoGateway } from '../../src/server/marketplace';
import { fixture } from '../support/fixture';
import { unseal } from '../../src/server/security';
test('OAuth uses state and PKCE, consumes state once and stores encrypted seller credentials', async () => {
  const f = await fixture();
  f.config.mpClientId = '123';
  f.config.mpClientSecret = 'secret';
  const gateway = new MercadoPagoGateway(f.store, f.config),
    url = new URL(await gateway.connect('teacher'));
  assert.equal(url.hostname, 'auth.mercadopago.com');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(url.searchParams.get('client_secret'), null);
  const original = globalThis.fetch;
  let requestBody: any;
  globalThis.fetch = async (_url, options) => {
    requestBody = JSON.parse(String(options?.body));
    return new Response(
      JSON.stringify({
        access_token: 'seller-access',
        refresh_token: 'seller-refresh',
        expires_in: 3600,
        user_id: 99,
      }),
      { status: 200 },
    );
  };
  try {
    await gateway.callback(url.searchParams.get('state')!, 'valid-code');
    assert.equal(requestBody.grant_type, 'authorization_code');
    assert.ok(requestBody.code_verifier.length >= 43);
    const row = (await f.store.get('seller_credentials', 'teacher'))!;
    assert.equal(row.sellerId, '99');
    assert.equal(row.encrypted.includes('seller-access'), false);
    assert.equal(unseal<any>(row.encrypted, f.config.tokenKey).access_token, 'seller-access');
    await assert.rejects(() => gateway.callback(url.searchParams.get('state')!, 'valid-code'));
    const order = {
      id: 'order',
      lessonId: 'lesson',
      teacherId: 'teacher',
      sellerId: '99',
      amountCents: 10000,
      feeCents: 1500,
      expiresAt: Date.now() + 600_000,
    };
    globalThis.fetch = async (_url, options) => {
      assert.equal((options?.headers as any).Authorization, 'Bearer seller-access');
      requestBody = JSON.parse(String(options?.body));
      return new Response(
        JSON.stringify({
          id: 'preference',
          init_point: 'https://www.mercadopago.com.br/live',
          sandbox_init_point: 'https://www.mercadopago.com.br/sandbox',
        }),
      );
    };
    const checkout = await gateway.checkout(order, 'teacher');
    assert.ok(checkout.url.endsWith('/sandbox'));
    assert.equal(requestBody.marketplace_fee, 15);
    assert.equal(requestBody.external_reference, 'order');
    assert.equal(requestBody.items[0].unit_price, 100);
    assert.equal(requestBody.items[0].currency_id, 'BRL');
    assert.equal(requestBody.notification_url, f.config.origin + '/api/payments/webhook');
    globalThis.fetch = async (url, options) => {
      if (String(url).includes('/refunds')) {
        assert.equal((options?.headers as any)['X-Idempotency-Key'], 'talke-refund-123');
        return new Response('{}');
      }
      if (String(url).includes('/search')) {
        assert.ok(String(url).includes('external_reference=order'));
        return new Response(JSON.stringify({ results: [], paging: { total: 0 } }));
      }
      return new Response(JSON.stringify({ id: 123, collector_id: 99 }));
    };
    await gateway.refund('123', 'teacher');
    assert.deepEqual(await gateway.search(order), []);
    assert.equal((await gateway.payment('123', '99')).id, 123);
    globalThis.fetch = async () => new Response('{}', { status: 401 });
    await assert.rejects(() => gateway.checkout(order, 'teacher'));
  } finally {
    globalThis.fetch = original;
  }
});
