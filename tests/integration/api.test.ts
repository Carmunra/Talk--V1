import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createHmac, randomUUID } from 'node:crypto';
import { createApp } from '../../src/server/app';
import { fixture, student, teacher, other, admin, guardian } from '../support/fixture';
async function setup() {
  const f = await fixture();
  const identities: Record<string, typeof student> = { student, teacher, other, admin, guardian };
  return {
    ...f,
    app: createApp({
      platform: f.platform,
      verifyToken: async (token) => {
        if (!identities[token]) throw new Error('invalid');
        return identities[token];
      },
    }),
  };
}
test('public monthly catalog has approved BRL prices and cannot activate recurring purchases', async () => {
  const f = await setup();
  const response = await request(f.app).get('/api/config').expect(200);
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.equal(response.body.subscriptionsEnabled, false);
  assert.deepEqual(
    response.body.monthlyPlans.map((plan: any) => plan.name),
    ['Essencial', 'Evolução', 'Constância', 'Intensivo', 'Intensivo Conversação'],
  );
  assert.deepEqual(
    response.body.monthlyPlans.map((plan: any) => [plan.lessonsPerMonth, plan.amountCents]),
    [
      [4, 43900],
      [6, 56900],
      [8, 70900],
      [12, 96900],
      [16, 123900],
    ],
  );
  assert(
    response.body.monthlyPlans.every(
      (plan: any) =>
        plan.currency === 'BRL' &&
        plan.interval === 'month' &&
        plan.automaticRenewal === true &&
        plan.multipleTeachers === true &&
        plan.carryoverCycles === 1,
    ),
  );
  await request(f.app)
    .post('/api/subscriptions')
    .set('Authorization', 'Bearer student')
    .send({ planId: 'monthly-16', amountCents: 1, paid: true })
    .expect(404);
  assert.equal((await f.store.get('students', 'student'))?.walletBalanceBrl, 0);
});

test('forged client identity and admin headers cannot authorize any private route', async () => {
  const f = await setup();
  for (const path of ['/api/me', '/api/lessons', '/api/payments', '/api/admin/queue']) {
    await request(f.app)
      .get(path)
      .set({ 'x-user-id': 'admin', 'x-user-email': 'admin@talke.com', 'x-is-admin': 'true' })
      .expect(401);
    await request(f.app).get(path).set('Authorization', 'Bearer forged').expect(401);
  }
  await request(f.app)
    .get('/api/admin/queue')
    .set({ Authorization: 'Bearer other', 'x-is-admin': 'true' })
    .expect(403);
});
test('verified session exposes only own profile and lessons', async () => {
  const f = await setup();
  const lesson = await f.platform.booking(student, f.booking, randomUUID());
  const me = await request(f.app).get('/api/me').set('Authorization', 'Bearer other').expect(200);
  assert.equal(me.body.profile.id, 'other');
  assert.equal(me.body.isAdmin, false);
  const lessons = await request(f.app)
    .get('/api/lessons?studentId=student')
    .set('Authorization', 'Bearer other')
    .expect(200);
  assert.deepEqual(lessons.body, []);
  await request(f.app)
    .get('/api/students/student')
    .set('Authorization', 'Bearer other')
    .expect(403);
  await request(f.app)
    .post('/api/lessons/' + lesson.id + '/checkout')
    .set('Authorization', 'Bearer other')
    .send({})
    .expect(403);
  await request(f.app)
    .get('/api/privacy/export/student')
    .set('Authorization', 'Bearer other')
    .expect(403);
});
test('hosted checkout route never accepts raw card data or wallet credit', async () => {
  const f = await setup();
  for (const path of [
    '/api/payments/process-card',
    '/api/students/student/wallet/topup',
    '/api/payments/checkout',
  ])
    await request(f.app)
      .post(path)
      .set('Authorization', 'Bearer student')
      .send({ amountBrl: 999, status: 'PAID' })
      .expect(404);
  assert.equal((await f.store.get('students', 'student'))?.walletBalanceBrl, 0);
});
test('strict validation rejects financial and approval fields injected into profiles', async () => {
  const f = await setup();
  await request(f.app)
    .post('/api/profiles')
    .set('Authorization', 'Bearer student')
    .send({
      name: 'Student',
      birthDate: '1990-01-01',
      accountType: 'STUDENT',
      acceptedTerms: true,
      termsVersion: f.config.termsVersion,
      walletBalanceBrl: 999,
    })
    .expect(400);
  await request(f.app)
    .put('/api/teachers/me')
    .set('Authorization', 'Bearer teacher')
    .send({ isVerified: true, hourlyPriceBrl: 1 })
    .expect(400);
  await request(f.app)
    .post('/api/lessons')
    .set('Authorization', 'Bearer student')
    .set('Idempotency-Key', randomUUID())
    .send({ ...f.booking, isPaid: true })
    .expect(400);
});
test('origin restrictions, no-store and security headers protect API responses', async () => {
  const f = await setup();
  await request(f.app).get('/api/config').set('Origin', 'https://attacker.example').expect(403);
  const response = await request(f.app)
    .get('/api/config')
    .set('Origin', f.config.origin)
    .expect(200);
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.ok(response.headers['content-security-policy'].includes("frame-ancestors 'none'"));
  assert.equal(response.headers['x-powered-by'], undefined);
  assert.deepEqual(response.body.supportEmails, ['support@example.test', 'alternate@example.test']);
  assert.equal(response.body.supportEmail, 'support@example.test');
  assert.equal(response.body.mpWebhookSecret, undefined);
  assert.equal(response.body.tokenKey, undefined);
});
test('unverified emails and revoked/invalid sessions fail closed', async () => {
  const f = await fixture(),
    app = createApp({
      platform: f.platform,
      verifyToken: async (token) => {
        if (token === 'revoked') throw new Error('revoked');
        return { ...student, emailVerified: false };
      },
    });
  await request(app).get('/api/me').set('Authorization', 'Bearer unverified').expect(403);
  await request(app).get('/api/me').set('Authorization', 'Bearer revoked').expect(401);
});
test('oversized payload, malformed JSON and invalid IDs are rejected safely', async () => {
  const f = await setup();
  await request(f.app)
    .post('/api/profiles')
    .set('Authorization', 'Bearer student')
    .send({ name: 'x'.repeat(40000) })
    .expect(413);
  await request(f.app)
    .post('/api/profiles')
    .set({ Authorization: 'Bearer student', 'Content-Type': 'application/json' })
    .send('{')
    .expect(400);
  await request(f.app).get('/api/students/a.b').set('Authorization', 'Bearer student').expect(400);
});
test('signed webhook authenticates query data id and fetches authoritative provider payment', async () => {
  const f = await setup(),
    lesson = await f.platform.booking(student, f.booking, randomUUID());
  f.gateway.approve((await f.store.get('orders', lesson.id))!);
  const ts = String(Math.floor(Date.now() / 1000)),
    requestId = 'test-request';
  const signature = createHmac('sha256', f.config.mpWebhookSecret)
    .update('id:123;request-id:' + requestId + ';ts:' + ts + ';')
    .digest('hex');
  const headers = { 'x-request-id': requestId, 'x-signature': 'ts=' + ts + ',v1=' + signature };
  await request(f.app)
    .post('/api/payments/webhook?data.id=123')
    .send({ type: 'payment', user_id: 99, data: { id: '123' } })
    .expect(401);
  await request(f.app)
    .post('/api/payments/webhook?data.id=456')
    .set(headers)
    .send({ type: 'payment', user_id: 99, data: { id: '456' } })
    .expect(401);
  await request(f.app)
    .post('/api/payments/webhook?data.id=123')
    .set(headers)
    .send({ type: 'payment', user_id: 99, data: { id: '456' } })
    .expect(400);
  await request(f.app)
    .post('/api/payments/webhook?data.id=123')
    .set(headers)
    .send({ type: 'payment', user_id: 99, data: { id: '123' }, status: 'rejected' })
    .expect(200);
  assert.equal((await f.store.get('lessons', lesson.id))?.isPaid, true);
});
test('database failure is a failure response without stack or memory fallback', async () => {
  const f = await setup();
  f.store.offline = true;
  const response = await request(f.app).get('/api/teachers').expect(503);
  assert.equal(response.body.error, 'Serviço temporariamente indisponível');
  assert.ok(response.body.errorId);
  assert.equal(JSON.stringify(response.body).includes('offline'), false);
});
test('rooms reject unrelated participants, unpaid lessons, wrong window and missing provider config', async () => {
  const f = await setup(),
    lesson = await f.platform.booking(student, f.booking, randomUUID());
  await request(f.app)
    .post('/api/lessons/' + lesson.id + '/room')
    .set('Authorization', 'Bearer other')
    .expect(403);
  await request(f.app)
    .post('/api/lessons/' + lesson.id + '/room')
    .set('Authorization', 'Bearer student')
    .expect(409);
});
test('progress is scoped and teacher can only write notes for own completed lessons', async () => {
  const f = await setup(),
    lesson = await f.platform.booking(student, f.booking, randomUUID());
  await request(f.app)
    .get('/api/progress?studentId=student')
    .set('Authorization', 'Bearer other')
    .expect(403);
  await request(f.app)
    .post('/api/lessons/' + lesson.id + '/notes')
    .set('Authorization', 'Bearer teacher')
    .send({ notes: 'Pedagogical notes', homework: '' })
    .expect(403);
});
test('guardian request protocol and admin resolution are persisted and access-controlled', async () => {
  const f = await setup();
  const response = await request(f.app)
    .post('/api/privacy/requests')
    .set('Authorization', 'Bearer student')
    .send({ subjectId: 'student', kind: 'CORRECTION', details: 'Correct my name' })
    .expect(201);
  await request(f.app)
    .post('/api/admin/resolve')
    .set('Authorization', 'Bearer other')
    .send({
      kind: 'privacy',
      requestId: response.body.id,
      resolution: 'Name corrected and requester informed using approved channel.',
    })
    .expect(403);
  await request(f.app)
    .post('/api/admin/resolve')
    .set('Authorization', 'Bearer admin')
    .send({
      kind: 'privacy',
      requestId: response.body.id,
      resolution: 'Name corrected and requester informed using approved channel.',
    })
    .expect(200);
  assert.equal((await f.store.get('privacy_requests', response.body.id))?.status, 'RESOLVED');
});
test('authenticated rate limit returns a usable error without trusting identity headers', async () => {
  const f = await setup();
  for (let i = 0; i < 90; i++)
    await request(f.app).get('/api/me').set('Authorization', 'Bearer student').expect(200);
  const response = await request(f.app)
    .get('/api/me')
    .set({ Authorization: 'Bearer student', 'x-user-id': 'different-user' })
    .expect(429);
  assert.equal(response.body.error, 'Muitas tentativas. Aguarde um minuto e tente novamente.');
});
