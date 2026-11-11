import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createApp } from '../../src/server/app';
import { student, teacher, other, admin, guardian } from '../support/fixture';
import { subscriptionFixture } from '../support/subscription-fixture';

async function setup() {
  const f = await subscriptionFixture();
  f.config.videoProvider = 'google_meet';
  const identities = { student, teacher, other, admin, guardian };
  const app = createApp({
    platform: f.platform,
    subscriptions: f.subscriptions,
    verifyToken: async (token) => {
      if (!(token in identities)) throw new Error('invalid');
      return identities[token as keyof typeof identities];
    },
  });
  const lesson = await f.book();
  const cycle = (await f.store.find('subscription_cycles', 'subscriptionId', 'sub_student'))[0];
  const cancel = (actor = 'student', body = {}) =>
    request(app)
      .post('/api/lessons/' + lesson.id + '/cancel')
      .set('Authorization', 'Bearer ' + actor)
      .send(body);
  return { ...f, app, lesson, cycle, cancel };
}

test('plan cancellation includes exactly 24 hours and rejects one millisecond after the cutoff', async () => {
  for (const notice of [24 * 3_600_000 + 1, 24 * 3_600_000, 24 * 3_600_000 - 1]) {
    const f = await setup();
    f.advance(f.lesson.scheduledAt - notice - f.platform.now());
    await f
      .cancel('student', { scheduledAt: f.lesson.scheduledAt + 86400_000 })
      .expect(notice >= 24 * 3_600_000 ? 200 : 409);
    assert.equal(
      (await f.store.get('subscription_cycles', f.cycle.id))!.remaining,
      notice >= 24 * 3_600_000 ? 4 : 3,
    );
    assert.equal(
      (await f.store.get('lessons', f.lesson.id))!.status,
      notice >= 24 * 3_600_000 ? 'CANCELLED' : 'CONFIRMED',
    );
    assert.equal(f.gateway.sendCalls, 0);
  }
});

test('concurrent cancellation returns the original credit once, releases both schedules and removes the Meet link', async () => {
  const f = await setup();
  await f.store.transaction(async (tx) =>
    tx.set('lesson_video_links', {
      id: f.lesson.id,
      url: 'https://meet.google.com/abc-defg-hij',
      status: 'READY',
    }),
  );
  const results = await Promise.all([f.cancel(), f.cancel()]);
  assert.deepEqual(
    results.map((r) => r.status),
    [200, 200],
  );
  assert.equal((await f.store.get('subscription_cycles', f.cycle.id))!.remaining, 4);
  assert.equal(
    (await f.store.get('subscription_cycles', f.cycle.id))!.expiresOn,
    f.cycle.expiresOn,
  );
  assert.equal((await f.store.get('subscription_reservations', f.lesson.id))!.status, 'CANCELLED');
  assert.equal(await f.store.get('lesson_video_links', f.lesson.id), null);
  for (const uid of ['student', 'teacher'])
    assert.equal(
      (await f.store.get('booking_days', uid + '_' + f.booking.scheduledDate))!.slots.length,
      0,
    );
  assert.equal((await f.store.find('subscription_payouts', 'lessonId', f.lesson.id)).length, 0);
  assert.equal((await f.store.find('audit_events', 'lessonId', f.lesson.id)).length, 1);
  assert.equal(f.gateway.sendCalls, 0);
  const first = await f.store.get('lessons', f.lesson.id);
  f.advance(f.lesson.scheduledAt + 3_600_000 - f.platform.now());
  await f.cancel().expect(200);
  assert.deepEqual(await f.store.get('lessons', f.lesson.id), first);
  await assert.rejects(() => f.platform.complete(teacher, f.lesson.id));
  // A later inconsistent lesson status must not turn the returned credit into a payout.
  await f.store.transaction(async (tx) => tx.set('lessons', { ...first!, status: 'COMPLETED' }));
  await assert.rejects(() => f.subscriptions.confirmCompletion(student, f.lesson.id));
  assert.equal((await f.store.find('subscription_payouts', 'lessonId', f.lesson.id)).length, 0);
  assert.equal(f.gateway.sendCalls, 0);
});

test('rescheduling uses a new reservation and preserves the fixed 60-day renewal-cancellation deadline', async () => {
  const f = await setup();
  f.config.subscriptionCancelCredits = '60_days_after_cancel';
  await f.subscriptions.cancel(student, 'sub_student');
  const prior = (await f.store.get('subscription_cycles', f.cycle.id))!;
  await f.cancel().expect(200);
  const replacement = await f.book('10:00');
  assert.notEqual(replacement.id, f.lesson.id);
  assert.equal(replacement.status, 'CONFIRMED');
  assert.equal((await f.store.get('subscription_cycles', f.cycle.id))!.remaining, 3);
  assert.equal((await f.store.get('subscription_cycles', f.cycle.id))!.expiresOn, prior.expiresOn);
  const retryKey = f.lesson.id.slice(student.uid.length + 1);
  assert.equal((await f.book('10:00', retryKey)).status, 'CANCELLED');
  assert.equal((await f.store.get('subscription_cycles', f.cycle.id))!.remaining, 3);
});

test('cancellation is private to the current payer and guardian relationship', async () => {
  const f = await setup();
  await request(f.app)
    .post('/api/lessons/' + f.lesson.id + '/cancel')
    .send({})
    .expect(401);
  for (const actor of ['other', 'teacher', 'admin', 'guardian']) await f.cancel(actor).expect(403);
  const family = await subscriptionFixture(false);
  const child = await family.platform.dependent(guardian, {
    name: 'Aluno dependente',
    birthDate: '2015-01-01',
    guardianDeclaration: true,
    termsVersion: family.config.termsVersion,
  });
  await family.platform.approve(
    admin,
    'guardian',
    child.id,
    'Vínculo verificado no teste de cancelamento',
  );
  family.gateway.customers.get('cus_student')!.email = guardian.email;
  await family.subscriptions.bind(admin, {
    ...family.binding,
    payerId: guardian.uid,
    studentId: child.id,
  });
  await family.subscriptions.reconcilePayment('pay_first');
  const booked = await family.platform.booking(
    guardian,
    { ...family.booking, studentId: child.id },
    randomUUID(),
    {
      subscriptions: family.subscriptions,
      subscriptionId: 'sub_student',
    },
  );
  await family.store.transaction(async (tx) => {
    const profile = await tx.get('profiles', child.id);
    tx.set('profiles', { ...profile!, guardianId: 'other' });
  });
  await assert.rejects(() => family.subscriptions.cancelLesson(guardian, booked.id));
  await family.store.transaction(async (tx) => {
    const profile = await tx.get('profiles', child.id);
    tx.set('profiles', { ...profile!, guardianId: guardian.uid });
  });
  assert.equal((await family.subscriptions.cancelLesson(guardian, booked.id)).creditReturned, true);
});

test('late cancellation and no-show stay in support review without automatic credit return or transfer', async () => {
  const f = await setup();
  f.advance(f.lesson.scheduledAt - 3_600_000 - f.platform.now());
  for (const advance of [0, 2 * 3_600_000]) {
    f.advance(advance);
    await f.cancel().expect(409);
    assert.equal((await f.store.get('subscription_cycles', f.cycle.id))!.remaining, 3);
    assert.equal((await f.store.get('lessons', f.lesson.id))!.status, 'CONFIRMED');
    assert.equal(f.gateway.sendCalls, 0);
  }
  await request(f.app)
    .post('/api/safety/reports')
    .set('Authorization', 'Bearer student')
    .send({ lessonId: f.lesson.id, details: 'Solicito análise do cancelamento desta aula.' })
    .expect(201);
  assert.equal((await f.store.find('safety_reports', 'lessonId', f.lesson.id)).length, 1);
  assert.equal((await f.store.find('subscription_payouts', 'lessonId', f.lesson.id)).length, 0);
});

test('inconsistent, refunded or expired credits cannot be restored by cancelling a lesson', async () => {
  for (const kind of ['adverse', 'expired', 'full', 'mismatch', 'payout', 'started', 'missing']) {
    const f = await setup();
    await f.store.transaction(async (tx) => {
      if (kind === 'adverse')
        tx.set('asaas_payments', {
          ...(await tx.get('asaas_payments', 'pay_first'))!,
          adverse: true,
        });
      if (kind === 'expired')
        tx.set('subscription_cycles', { ...f.cycle, expiresOn: '2000-01-01' });
      if (kind === 'full') tx.set('subscription_cycles', { ...f.cycle, remaining: f.cycle.total });
      if (kind === 'mismatch')
        tx.set('subscription_reservations', {
          ...(await tx.get('subscription_reservations', f.lesson.id))!,
          teacherId: 'other',
        });
      if (kind === 'payout') {
        const { createHash } = await import('node:crypto');
        tx.set('subscription_payouts', {
          id: createHash('sha256').update(f.lesson.id).digest('hex'),
          lessonId: f.lesson.id,
          status: 'QUEUED',
        });
      }
      if (kind === 'started') tx.set('lessons', { ...f.lesson, status: 'IN_PROGRESS' });
      if (kind === 'missing') tx.remove('subscription_cycles', f.cycle.id);
    });
    const before = await f.store.get('subscription_cycles', f.cycle.id);
    await f.cancel().expect(409);
    assert.deepEqual(await f.store.get('subscription_cycles', f.cycle.id), before);
    assert.equal(f.gateway.sendCalls, 0);
  }
});

test('a later refund revokes a returned credit and repeated cancellation cannot resurrect it', async () => {
  const f = await setup();
  await f.cancel().expect(200);
  f.gateway.payments.get('pay_first')!.status = 'REFUNDED';
  await f.subscriptions.reconcilePayment('pay_first');
  await f.cancel().expect(200);
  assert.equal((await f.store.get('subscription_cycles', f.cycle.id))!.remaining, 0);
  assert.equal((await f.store.get('subscription_cycles', f.cycle.id))!.status, 'REVIEW');
});

test('pausing new subscription sales does not prevent a valid existing lesson cancellation', async () => {
  const f = await setup();
  f.config.subscriptionsEnabled = false;
  f.config.asaasSandboxEnabled = false;
  await f.cancel().expect(200);
  assert.equal((await f.store.get('subscription_cycles', f.cycle.id))!.remaining, 4);
});
