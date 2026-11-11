import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../src/server/app';
import { fixture } from '../support/fixture';
import { readConfig } from '../../src/server/config';

test('proxy trust rejects unsafe values and defaults to ignoring forwarded addresses', () => {
  assert.equal(readConfig({}).trustProxyHops, 0);
  for (const value of ['true', '2', '-1', 'all'])
    assert.throws(() => readConfig({ TRUST_PROXY_HOPS: value }));
});

test('the isolated single proxy preserves per-client limits and ignores forged addresses before the final hop', async () => {
  const f = await fixture();
  f.platform.config.trustProxyHops = 1;
  const app = createApp({
    platform: f.platform,
    verifyToken: async () => {
      throw new Error('fixture');
    },
  });
  assert.equal(app.get('trust proxy'), 1);
  // Same final client, different forged left-most address: they still share a limit.
  for (let i = 0; i < 180; i++)
    await request(app)
      .get('/api/health')
      .set('X-Forwarded-For', '198.51.100.' + ((i % 200) + 1) + ', 203.0.113.10')
      .expect(200);
  await request(app)
    .get('/api/health')
    .set('X-Forwarded-For', '198.51.100.220, 203.0.113.10')
    .expect(429);
  await request(app).get('/api/health').set('X-Forwarded-For', '203.0.113.20').expect(200);
});

test('without a trusted proxy forwarded addresses cannot bypass rate limiting', async () => {
  const f = await fixture();
  const app = createApp({
    platform: f.platform,
    verifyToken: async () => {
      throw new Error('fixture');
    },
  });
  for (let i = 0; i < 180; i++) await request(app).get('/api/health').expect(200);
  await request(app).get('/api/health').set('X-Forwarded-For', '203.0.113.99').expect(429);
});
