import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createApp } from '../../src/server/app';
import { fixture, student, teacher, other, admin } from '../support/fixture';
import { subscriptionFixture, wallet } from '../support/subscription-fixture';

const meet = 'https://meet.google.com/abc-defg-hij';
const body = { url: meet, hostControlsConfirmed: true };
async function setup(paid = true) {
  const f = await fixture();
  f.config.videoProvider = 'google_meet';
  const lesson = await f.platform.booking(student, f.booking, randomUUID());
  if (paid) {
    f.gateway.approve((await f.store.get('orders', lesson.id))!);
    await f.platform.reconcilePayment('123', '99');
  }
  const identities = { student, teacher, other, admin };
  const app = createApp({
    platform: f.platform,
    verifyToken: async (token) => {
      if (!(token in identities)) throw new Error('invalid');
      return identities[token as keyof typeof identities];
    },
  });
  const save = (actor = 'teacher', payload: any = body, id = lesson.id) =>
    request(app)
      .post('/api/lessons/' + id + '/video-link')
      .set('Authorization', 'Bearer ' + actor)
      .send(payload);
  const enter = (actor = 'student') =>
    request(app)
      .post('/api/lessons/' + lesson.id + '/room')
      .set('Authorization', 'Bearer ' + actor);
  return { ...f, lesson, app, save, enter };
}

test('only the approved owning teacher can register a direct Meet URL for a paid live lesson', async () => {
  const f = await setup();
  await request(f.app)
    .post('/api/lessons/' + f.lesson.id + '/video-link')
    .send(body)
    .expect(401);
  for (const actor of ['student', 'other', 'admin']) await f.save(actor).expect(403);
  for (const url of [
    'javascript:alert(1)',
    'https://evil.test/abc-defg-hij',
    meet + '?redirect=https://evil.test',
    'https://meet.google.com.evil.test/abc-defg-hij',
    'https://user:password@meet.google.com/abc-defg-hij',
    meet + '/extra',
  ]) {
    await f.save('teacher', { ...body, url }).expect(400);
  }
  await f.save('teacher', { ...body, hostControlsConfirmed: false }).expect(400);
  await f.save('teacher', { ...body, teacherId: 'other' }).expect(400);
  await f.save().expect(200);
  await f.save().expect(200);
  assert.equal((await f.store.get('lesson_video_links', f.lesson.id))!.url, meet);
  const lessons = await request(f.app)
    .get('/api/lessons')
    .set('Authorization', 'Bearer student')
    .expect(200);
  assert.equal(JSON.stringify(lessons.body).includes(meet), false);
  const unpaid = await setup(false);
  await unpaid.save().expect(409);
});

test('Meet access is scoped to paid participants, scheduled window and current authorizations without Daily calls', async () => {
  const f = await setup();
  await f.save().expect(200);
  await f.enter().expect(409);
  f.advance(f.lesson.scheduledAt - f.platform.now());
  const response = await f.enter().expect(200);
  assert.equal(response.body.provider, 'google_meet');
  assert.equal(response.body.roomUrl, meet);
  assert.equal('token' in response.body, false);
  assert.match(response.headers['cache-control'], /no-store/);
  await f.enter('teacher').expect(200);
  await f.enter('other').expect(403);
  await f.enter('admin').expect(403);
  await f.store.transaction(async (tx) => {
    const row = await tx.get('teachers', teacher.uid);
    tx.set('teachers', { ...row!, isVerified: false });
  });
  await f.enter().expect(403);
  await f.store.transaction(async (tx) => {
    const row = await tx.get('teachers', teacher.uid);
    tx.set('teachers', { ...row!, isVerified: true });
    const subject = await tx.get('profiles', student.uid);
    tx.set('profiles', { ...subject!, status: 'CONSENT_WITHDRAWN' });
  });
  await f.enter('teacher').expect(403);
});

test('a Meet link cannot be claimed concurrently by different lessons or reused after completion', async () => {
  const f = await setup();
  const second = await f.platform.booking(
    student,
    { ...f.booking, startTime: '11:00' },
    randomUUID(),
  );
  f.gateway.approve((await f.store.get('orders', second.id))!, '124');
  await f.platform.reconcilePayment('124', '99');
  const results = await Promise.all([f.save(), f.save('teacher', body, second.id)]);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
  const ownedId = results[0].status === 200 ? f.lesson.id : second.id;
  const owned = await f.store.get('lessons', ownedId);
  f.advance(owned!.scheduledAt + 50 * 60_000 - f.platform.now());
  await request(f.app)
    .post('/api/lessons/' + ownedId + '/complete')
    .set('Authorization', 'Bearer teacher')
    .expect(200);
  assert.equal(await f.store.get('lesson_video_links', ownedId), null);
  const claimId = (await import('node:crypto')).createHash('sha256').update(meet).digest('hex');
  assert.deepEqual(await f.store.get('meet_link_claims', claimId), { id: claimId });
});

test('expired Meet links and cancellation queue entries are removed without pretending to end external calls', async () => {
  const f = await setup();
  await f.save().expect(200);
  f.advance(f.lesson.scheduledAt + 66 * 60_000 - f.platform.now());
  await f.enter().expect(409);
  const { VideoService } = await import('../../src/server/video');
  const video = new VideoService(f.store, f.config, () => f.platform.now());
  await video.retryClosures();
  assert.equal(await f.store.get('lesson_video_links', f.lesson.id), null);
  await f.store.transaction(async (tx) =>
    tx.set('room_closures', { id: f.lesson.id, lessonId: f.lesson.id, status: 'PENDING' }),
  );
  await video.retryClosures();
  assert.equal(await f.store.get('room_closures', f.lesson.id), null);
});

test('teacher earnings contain only that teachers own obligations and no receiving credentials', async () => {
  const f = await subscriptionFixture();
  const app = createApp({
    platform: f.platform,
    subscriptions: f.subscriptions,
    verifyToken: async (token) => (token === 'teacher' ? teacher : student),
  });
  const lesson = await f.book();
  f.advance(lesson.scheduledAt + 50 * 60_000 - f.platform.now());
  await f.platform.complete(teacher, lesson.id);
  await request(app).get('/api/teachers/me/earnings').expect(401);
  await request(app)
    .get('/api/teachers/me/earnings')
    .set('Authorization', 'Bearer student')
    .expect(403);
  let result = await request(app)
    .get('/api/teachers/me/earnings')
    .set('Authorization', 'Bearer teacher')
    .expect(200);
  assert.equal(result.body.awaitingConfirmation.length, 1);
  assert.equal(result.body.payoutPerLessonCents, 4000);
  assert.equal(result.body.recipientVerified, true);
  await f.subscriptions.confirmCompletion(student, lesson.id);
  await f.store.transaction(async (tx) =>
    tx.set('subscription_payouts', {
      id: 'unrelated',
      teacherId: 'other',
      amountCents: 99999,
      status: 'DONE',
      walletId: 'private',
    }),
  );
  result = await request(app)
    .get('/api/teachers/me/earnings')
    .set('Authorization', 'Bearer teacher')
    .expect(200);
  assert.equal(result.body.awaitingConfirmation.length, 0);
  assert.equal(result.body.payouts.length, 1);
  assert.equal(result.body.payouts[0].status, 'DONE');
  assert.equal(JSON.stringify(result.body).includes(wallet), false);
  assert.equal(JSON.stringify(result.body).includes('unrelated'), false);
});
