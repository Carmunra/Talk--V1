import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createApp } from '../../src/server/app';
import { fixture, student, teacher, other } from '../support/fixture';
import { roomName } from '../../src/server/video';
test('paid participant receives a private room token only during the scheduled window', async () => {
  const f = await fixture(),
    lesson = await f.platform.booking(student, f.booking, randomUUID());
  f.gateway.approve((await f.store.get('orders', lesson.id))!);
  await f.platform.reconcilePayment('123', '99');
  const app = createApp({
    platform: f.platform,
    verifyToken: async (token) =>
      token === 'student' ? student : token === 'teacher' ? teacher : other,
  });
  await request(app)
    .post('/api/lessons/' + lesson.id + '/room')
    .set('Authorization', 'Bearer student')
    .expect(409);
  f.advance(lesson.scheduledAt - f.platform.now());
  await request(app)
    .post('/api/lessons/' + lesson.id + '/room')
    .set('Authorization', 'Bearer student')
    .expect(503);
  f.config.dailyKey = 'test-secret';
  f.config.dailyDomain = 'test';
  const original = globalThis.fetch;
  let tokenProperties: any;
  globalThis.fetch = async (url, options) => {
    if (String(url).includes('/meeting-tokens')) {
      tokenProperties = JSON.parse(String(options?.body)).properties;
      return new Response(JSON.stringify({ token: 'secure-token' }));
    }
    return new Response(JSON.stringify({ name: roomName(lesson.id), privacy: 'private' }));
  };
  try {
    const response = await request(app)
      .post('/api/lessons/' + lesson.id + '/room')
      .set('Authorization', 'Bearer student')
      .expect(200);
    assert.equal(response.body.token, 'secure-token');
    assert.equal(tokenProperties.user_id, 'student');
    assert.equal(tokenProperties.is_owner, false);
    await request(app)
      .post('/api/lessons/' + lesson.id + '/room')
      .set('Authorization', 'Bearer teacher')
      .expect(200);
    assert.equal(tokenProperties.is_owner, true);
    await request(app)
      .post('/api/lessons/' + lesson.id + '/room')
      .set('Authorization', 'Bearer other')
      .expect(403);
    await f.store.transaction(async (tx) => {
      const row = await tx.get('profiles', student.uid);
      tx.set('profiles', { ...row!, status: 'CONSENT_WITHDRAWN' });
    });
    await request(app)
      .post('/api/lessons/' + lesson.id + '/room')
      .set('Authorization', 'Bearer teacher')
      .expect(403);
  } finally {
    globalThis.fetch = original;
  }
});
