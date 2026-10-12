import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkoutLink } from '../../src/lib/checkoutLink';
const id = '43c4bc1b-0227-49ae-b363-21d497891ef3';
test('checkout navigation is restricted to the selected provider environment', () => {
  for (const sandbox of [true, false]) {
    const origin = sandbox ? 'https://sandbox.asaas.com' : 'https://asaas.com';
    assert.equal(
      checkoutLink(`${origin}/checkoutSession/show?id=${id}`, sandbox),
      `${origin}/checkoutSession/show?id=${id}`,
    );
  }
  for (const url of [
    `https://asaas.com/checkoutSession/show?id=${id}`,
    `http://sandbox.asaas.com/checkoutSession/show?id=${id}`,
    `https://sandbox.asaas.com.evil.test/checkoutSession/show?id=${id}`,
    `https://attacker@sandbox.asaas.com/checkoutSession/show?id=${id}`,
    `https://sandbox.asaas.com:8443/checkoutSession/show?id=${id}`,
    'javascript:alert(1)',
    `https://sandbox.asaas.com/other?id=${id}`,
    'https://sandbox.asaas.com/checkoutSession/show?id=invalid',
  ])
    assert.throws(() => checkoutLink(url, true));
});
