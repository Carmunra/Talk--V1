import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { createApp } from '../../src/server/app';
import { addCalendarMonths } from '../../src/server/subscriptions';
import { PrivacyService } from '../../src/server/privacy';
import { student, teacher, admin, other, guardian } from '../support/fixture';
import { subscriptionFixture, wallet, account } from '../support/subscription-fixture';

async function appFixture(bind = true) {
  const f = await subscriptionFixture(bind);
  const identities: Record<string, typeof student> = { student, teacher, admin, other, guardian };
  return {
    ...f,
    app: createApp({
      platform: f.platform,
      subscriptions: f.subscriptions,
      verifyToken: async (token) => {
        if (!identities[token]) throw new Error('invalid');
        return identities[token];
      },
    }),
  };
}

test('maintenance rotates bounded subscription pages instead of starving records after the first hundred', async () => {
  const f = await subscriptionFixture(false);
  const seen: string[] = [];
  const original = f.gateway.subscription.bind(f.gateway);
  f.gateway.subscription = async (id) => {
    seen.push(id);
    return original(id);
  };
  await f.store.transaction(async (tx) => {
    for (let n = 0; n < 101; n++) {
      const id = 'sub_' + String(n).padStart(3, '0');
      f.gateway.subscriptions.set(id, {
        id,
        customer: 'cus_student',
        value: 439,
        cycle: 'MONTHLY',
        billingType: 'CREDIT_CARD',
        status: 'ACTIVE',
      });
      tx.set('subscriptions', {
        id,
        status: 'ACTIVE',
        customerId: 'cus_student',
        amountCents: 43900,
      });
    }
  });
  assert.equal((await f.subscriptions.syncSubscriptions()).failures, 0);
  assert.equal(seen.length, 100);
  await f.subscriptions.syncSubscriptions();
  assert.equal(seen.at(-1), 'sub_100');
  await f.subscriptions.syncSubscriptions();
  assert.equal(seen.filter((id) => id === 'sub_000').length, 2);
  assert.equal(new Set(seen).size, 101);
});

test('failed early webhook events do not prevent later events from being processed', async () => {
  const f = await subscriptionFixture(false);
  await f.store.transaction(async (tx) => {
    for (let n = 0; n < 100; n++)
      tx.set('asaas_events', {
        id: String(n).padStart(3, '0'),
        status: 'PENDING',
        event: 'PAYMENT_RECEIVED',
        paymentId: 'missing',
      });
    tx.set('asaas_events', { id: 'last', status: 'PENDING', event: 'SUBSCRIPTION_CREATED' });
  });
  assert.equal((await f.subscriptions.drainEvents()).failures, 100);
  assert.equal((await f.subscriptions.drainEvents()).failures, 0);
  assert.equal((await f.store.get('asaas_events', 'last'))!.status, 'PROCESSED');
  assert.equal((await f.store.get('asaas_events', '000'))!.status, 'PENDING');
});

test('subscription catalog and checkout resume are gated and scoped to the payer', async () => {
  const f = await appFixture(false);
  assert.equal((await request(f.app).get('/api/config')).body.subscriptionsEnabled, false);
  f.config.subscriptionsEnabled = true;
  assert.equal((await request(f.app).get('/api/config')).body.subscriptionsEnabled, true);
  const headers = { Authorization: 'Bearer student', 'Idempotency-Key': randomUUID() };
  const result = await request(f.app)
    .post('/api/subscriptions/checkout')
    .set(headers)
    .send({ studentId: 'student', planId: 'monthly-4' })
    .expect(200);
  assert.equal(result.body.sandbox, true);
  await request(f.app)
    .post('/api/subscriptions/checkout')
    .set(headers)
    .send({ studentId: 'student', planId: 'monthly-4' })
    .expect(200);
  assert.equal(f.gateway.checkoutCalls, 1);
  const own = await request(f.app)
    .get('/api/subscriptions/checkouts')
    .set('Authorization', 'Bearer student')
    .expect(200);
  assert.equal(own.body.length, 1);
  assert.equal(own.body[0].url, result.body.url);
  assert.equal('payerId' in own.body[0], false);
  assert.deepEqual(
    (
      await request(f.app)
        .get('/api/subscriptions/checkouts')
        .set('Authorization', 'Bearer other')
        .expect(200)
    ).body,
    [],
  );
  await request(f.app).get('/api/subscriptions/checkouts').expect(401);
});

test('financial administration is restricted and exported data excludes provider credentials', async () => {
  const f = await appFixture();
  await request(f.app).get('/api/admin/subscriptions/status').expect(401);
  await request(f.app)
    .get('/api/admin/subscriptions/status')
    .set('Authorization', 'Bearer student')
    .set('x-is-admin', 'true')
    .expect(403);
  const result = await request(f.app)
    .get('/api/admin/subscriptions/status')
    .set('Authorization', 'Bearer admin')
    .expect(200);
  assert.equal(result.body.recipients[0].recipientVerified, true);
  assert.equal(JSON.stringify(result.body).includes(wallet), false);
  assert.equal(JSON.stringify(result.body).includes(f.config.asaasApiKey), false);
});

test('deletion preserves unresolved paid credits under the keep-until-expiry policy', async () => {
  const f = await subscriptionFixture();
  f.config.subscriptionCancelCredits = 'keep_until_expiry';
  await f.subscriptions.cancel(student, 'sub_student');
  const privacy = new PrivacyService(f.platform);
  const pending = await privacy.request(student, student.uid, 'DELETION', 'Excluir minha conta');
  await assert.rejects(
    () =>
      privacy.fulfillDeletion(
        admin,
        pending.id,
        'Reter somente os registros financeiros necessários',
      ),
    /saldo de aulas/,
  );
  assert.equal((await f.store.get('profiles', student.uid))!.status, 'ACTIVE');
});

test('authenticated terminal checkout events release only unpaid, unbound purchases', async () => {
  const f = await subscriptionFixture(false);
  await f.subscriptions.checkout(
    student,
    { studentId: 'student', planId: 'monthly-4' },
    randomUUID(),
  );
  const event = {
    id: 'checkout_expiry',
    event: 'CHECKOUT_EXPIRED',
    account: { id: account },
    checkout: { id: f.gateway.checkoutId },
  };
  await f.subscriptions.receiveEvent(event);
  await f.subscriptions.receiveEvent(event);
  assert.equal((await f.subscriptions.drainEvents()).failures, 0);
  assert.deepEqual(await f.subscriptions.checkouts(student), []);
  await f.subscriptions.checkout(
    student,
    { studentId: 'student', planId: 'monthly-4' },
    randomUUID(),
  );
  assert.equal(f.gateway.checkoutCalls, 2);
  f.gateway.checkoutRows = [f.payment];
  await f.subscriptions.reconcileCheckouts();
  await f.subscriptions.receiveEvent({
    ...event,
    id: 'stale_checkout_cancel',
    event: 'CHECKOUT_CANCELED',
  });
  await f.subscriptions.drainEvents();
  assert.equal((await f.subscriptions.summary(student))[0].cycles[0].remaining, 4);
  await assert.rejects(() =>
    f.subscriptions.receiveEvent({ ...event, id: 'no-checkout', checkout: undefined }),
  );
});

test('cancelled plan credit policy is explicit and never extends the original expiry', async () => {
  for (const policy of ['keep_until_expiry', 'block_booking'] as const) {
    const f = await subscriptionFixture();
    f.config.subscriptionCancelCredits = policy;
    await f.subscriptions.cancel(student, 'sub_student');
    const summary = (await f.subscriptions.summary(student))[0];
    assert.equal(summary.cycles[0].remaining, policy === 'keep_until_expiry' ? 4 : 0);
    assert.deepEqual(Object.keys(summary.payments[0]).sort(), [
      'amountCents',
      'dueDate',
      'id',
      'status',
    ]);
    if (policy === 'keep_until_expiry') {
      await f.book();
      assert.equal((await f.subscriptions.summary(student))[0].cycles[0].remaining, 3);
      f.advance(100 * 86400000);
      assert.equal((await f.subscriptions.summary(student))[0].cycles[0].remaining, 0);
    } else await assert.rejects(() => f.book());
  }
});

test('production-mode subscription booking does not require Mercado Pago and lists Asaas-only teachers', async () => {
  const f = await subscriptionFixture();
  Object.assign(f.config, {
    production: true,
    asaasSandboxEnabled: false,
    subscriptionsEnabled: true,
    asaasEnvironment: 'live',
    paymentsEnabled: false,
  });
  await f.store.transaction(async (tx) => {
    const row = await tx.get('teachers', 'teacher');
    tx.set('teachers', { ...row!, paymentConnected: false });
  });
  const teachers = await f.platform.publicTeachers();
  assert.equal(teachers.length, 1);
  assert.equal('walletId' in teachers[0], false);
  assert.equal((await f.book()).fundingSource, 'ASAAS_SUBSCRIPTION');
  await assert.rejects(() =>
    f.platform.booking(student, { ...f.booking, startTime: '11:00' }, randomUUID()),
  );
});
test('monthly calendar handles leap years, month ends and preserves original day through clamped months', () => {
  assert.equal(addCalendarMonths('2026-01-31', 1), '2026-02-28');
  assert.equal(addCalendarMonths('2026-01-31', 2), '2026-03-31');
  assert.equal(addCalendarMonths('2026-02-28', 2, 31), '2026-04-30');
  assert.equal(addCalendarMonths('2028-01-31', 1), '2028-02-29');
  assert.equal(addCalendarMonths('2026-12-11', 2), '2027-02-11');
  for (const date of ['bad', '2026-02-30']) assert.throws(() => addCalendarMonths(date, 2));
  assert.throws(() => addCalendarMonths('2026-10-11', 2, 0));
});
test('binding is admin-only, validates customer ownership and price, and is idempotent', async () => {
  const f = await subscriptionFixture(false);
  await assert.rejects(() => f.subscriptions.bind(other, f.binding));
  f.gateway.customers.get('cus_student')!.email = other.email;
  await assert.rejects(() => f.subscriptions.bind(admin, f.binding));
  f.gateway.customers.get('cus_student')!.email = student.email;
  f.gateway.subscriptions.get('sub_student')!.value = 1;
  await assert.rejects(() => f.subscriptions.bind(admin, f.binding));
  f.gateway.subscriptions.get('sub_student')!.value = 439;
  await f.subscriptions.bind(admin, f.binding);
  await f.subscriptions.bind(admin, f.binding);
  await assert.rejects(() =>
    f.subscriptions.bind(admin, { ...f.binding, firstDueDate: '2026-01-01' }),
  );
  assert.equal((await f.store.find('subscriptions', 'payerId', student.uid)).length, 1);
});
test('verified current payment issues credits exactly once despite concurrent or delayed events', async () => {
  const f = await subscriptionFixture();
  await Promise.all([
    f.subscriptions.reconcilePayment('pay_first'),
    f.subscriptions.reconcilePayment('pay_first'),
  ]);
  const cycles = await f.store.find('subscription_cycles', 'subscriptionId', 'sub_student');
  assert.equal(cycles.length, 1);
  assert.equal(cycles[0].remaining, 4);
  assert.equal(cycles[0].expiresOn, addCalendarMonths(f.dueDate, 2));
  f.gateway.payments.set('pay_duplicate', { ...f.payment, id: 'pay_duplicate' });
  await assert.rejects(() => f.subscriptions.reconcilePayment('pay_duplicate'));
  f.gateway.payments.get('pay_first')!.value = 1;
  await assert.rejects(() => f.subscriptions.reconcilePayment('pay_first'));
  assert.equal((await f.store.get('subscription_cycles', cycles[0].id))!.remaining, 4);
});
test('pending or refused renewal grants no credits and a later paid cycle grants only its allowance', async () => {
  const f = await subscriptionFixture();
  const next = {
    ...f.payment,
    id: 'pay_next',
    dueDate: addCalendarMonths(f.dueDate, 1),
    status: 'PENDING',
  };
  f.gateway.payments.set(next.id, next);
  await f.subscriptions.reconcilePayment(next.id);
  assert.equal(
    (await f.store.find('subscription_cycles', 'subscriptionId', 'sub_student')).length,
    1,
  );
  next.status = 'RECEIVED';
  await f.subscriptions.reconcilePayment(next.id);
  assert.equal(
    (await f.store.find('subscription_cycles', 'subscriptionId', 'sub_student')).length,
    2,
  );
});
test('oldest valid credits are consumed first and cannot be scheduled after their expiry', async () => {
  const f = await subscriptionFixture();
  const original = (await f.store.find('subscription_cycles', 'subscriptionId', 'sub_student'))[0];
  await f.store.transaction(async (tx) => {
    tx.set('subscription_cycles', {
      ...original,
      id: 'older',
      remaining: 1,
      expiresOn: addCalendarMonths(f.dueDate, 1),
    });
  });
  const lesson = await f.book();
  assert.equal((await f.store.get('subscription_reservations', lesson.id))!.cycleId, 'older');
  assert.equal((await f.store.get('subscription_cycles', original.id))!.remaining, 4);
  assert.equal((await f.store.get('subscription_cycles', 'older'))!.remaining, 0);
  const key = randomUUID();
  await assert.rejects(() =>
    f.platform.booking(
      student,
      { ...f.booking, scheduledDate: addCalendarMonths(f.dueDate, 2) },
      key,
      { subscriptions: f.subscriptions, subscriptionId: 'sub_student' },
    ),
  );
});
test('overlapping or excess concurrent reservations cannot consume an extra credit', async () => {
  const f = await subscriptionFixture();
  const duplicate = await Promise.allSettled([f.book(), f.book()]);
  assert.equal(duplicate.filter((r) => r.status === 'fulfilled').length, 1);
  const reservations = await Promise.allSettled(
    ['11:00', '12:00', '13:00', '14:00'].map((t) => f.book(t)),
  );
  assert.equal(reservations.filter((r) => r.status === 'fulfilled').length, 3);
  const cycle = (await f.store.find('subscription_cycles', 'subscriptionId', 'sub_student'))[0];
  assert.equal(cycle.remaining, 0);
  const idempotencyKey = randomUUID();
  await assert.rejects(() => f.book('15:00', idempotencyKey));
  assert.equal(await f.store.get('lessons', `${student.uid}_${idempotencyKey}`), null);
});
test('reservations allow different verified teachers and do not require Mercado Pago credentials', async () => {
  const f = await subscriptionFixture();
  await f.store.transaction(async (tx) => {
    const profile = await tx.get('profiles', 'teacher'),
      row = await tx.get('teachers', 'teacher');
    tx.set('profiles', { ...profile!, id: 'teacher2' });
    tx.set('teachers', {
      ...row!,
      id: 'teacher2',
      name: 'Another teacher',
      paymentConnected: false,
    });
    tx.set('asaas_recipients', {
      id: 'teacher2',
      walletId: account,
      verified: true,
      accountId: account,
    });
    tx.remove('seller_credentials', 'teacher');
  });
  const first = await f.book();
  const second = await f.platform.booking(
    student,
    { ...f.booking, teacherId: 'teacher2', startTime: '11:00' },
    randomUUID(),
    { subscriptions: f.subscriptions, subscriptionId: 'sub_student' },
  );
  assert.equal(first.status, 'CONFIRMED');
  assert.equal(second.status, 'CONFIRMED');
  assert.equal(first.teacherNetBrl, 40);
  assert.equal(await f.store.get('orders', first.id), null);
  await assert.rejects(() => f.platform.checkout(student, first.id));
});
test('booking retries cannot change funding source and do not spend twice', async () => {
  const f = await subscriptionFixture(),
    retryKey = randomUUID();
  const first = await f.book('10:00', retryKey),
    second = await f.book('10:00', retryKey);
  assert.equal(first.id, second.id);
  assert.equal(
    (await f.store.find('subscription_cycles', 'subscriptionId', 'sub_student'))[0].remaining,
    3,
  );
  await assert.rejects(() => f.platform.booking(student, f.booking, retryKey));
  await assert.rejects(() =>
    f.platform.booking(
      other,
      { ...f.booking, studentId: other.uid, startTime: '11:00' },
      randomUUID(),
      { subscriptions: f.subscriptions, subscriptionId: 'sub_student' },
    ),
  );
});
test('only completed lessons confirmed by their payer create a R$40 automatic payout', async () => {
  const f = await subscriptionFixture();
  const lesson = await f.book();
  await assert.rejects(() => f.subscriptions.confirmCompletion(student, lesson.id));
  await assert.rejects(() => f.platform.complete(teacher, lesson.id));
  f.advance(lesson.scheduledAt + 50 * 60_000 - f.platform.now());
  await f.platform.complete(teacher, lesson.id);
  assert.equal(f.gateway.sendCalls, 0);
  await assert.rejects(() => f.subscriptions.confirmCompletion(other, lesson.id));
  await Promise.all([
    f.subscriptions.confirmCompletion(student, lesson.id),
    f.subscriptions.confirmCompletion(student, lesson.id),
  ]);
  assert.equal(f.gateway.sendCalls, 1);
  const payout = (await f.store.find('subscription_payouts', 'lessonId', lesson.id))[0];
  assert.equal(payout.amountCents, 4000);
  assert.equal(payout.walletId, wallet);
  assert.equal(payout.status, 'DONE');
});
test('unsettled funds or low available balance delay payout until reconciliation', async () => {
  const f = await subscriptionFixture();
  f.gateway.payments.get('pay_first')!.status = 'CONFIRMED';
  await f.subscriptions.reconcilePayment('pay_first');
  const lesson = await f.book();
  f.advance(lesson.scheduledAt + 50 * 60_000 - f.platform.now());
  await f.platform.complete(teacher, lesson.id);
  await f.subscriptions.confirmCompletion(student, lesson.id);
  assert.equal(f.gateway.sendCalls, 0);
  f.gateway.payments.get('pay_first')!.status = 'RECEIVED';
  f.gateway.available = 3999;
  await f.subscriptions.reconcilePayment('pay_first');
  assert.equal(f.gateway.sendCalls, 0);
  f.gateway.available = 4000;
  await f.subscriptions.processQueued();
  assert.equal(f.gateway.sendCalls, 1);
});
test('transfer timeout is quarantined without resending, even when provider actually transferred', async () => {
  const f = await subscriptionFixture();
  f.gateway.failSend = true;
  const lesson = await f.book();
  f.advance(lesson.scheduledAt + 50 * 60_000 - f.platform.now());
  await f.platform.complete(teacher, lesson.id);
  await f.subscriptions.confirmCompletion(student, lesson.id);
  const payout = (await f.store.find('subscription_payouts', 'lessonId', lesson.id))[0];
  assert.equal(payout.status, 'UNKNOWN');
  assert.equal(payout.reviewRequired, true);
  await f.subscriptions.processQueued();
  await f.subscriptions.confirmCompletion(student, lesson.id);
  assert.equal(f.gateway.sendCalls, 1);
});
test('pending transfer is read from provider and marked done without another POST', async () => {
  const f = await subscriptionFixture();
  f.gateway.transferStatus = 'PENDING';
  const lesson = await f.book();
  f.advance(lesson.scheduledAt + 50 * 60_000 - f.platform.now());
  await f.platform.complete(teacher, lesson.id);
  await f.subscriptions.confirmCompletion(student, lesson.id);
  const payout = (await f.store.find('subscription_payouts', 'lessonId', lesson.id))[0];
  f.gateway.transfers.get(payout.transferId)!.status = 'DONE';
  await f.subscriptions.processQueued();
  assert.equal((await f.store.get('subscription_payouts', payout.id))!.status, 'DONE');
  assert.equal(f.gateway.sendCalls, 1);
});
test('refund/chargeback freezes credits, cancels future lessons, releases slots and cannot be replayed as paid', async () => {
  const f = await subscriptionFixture(),
    lesson = await f.book();
  f.gateway.payments.get('pay_first')!.status = 'CHARGEBACK_REQUESTED';
  await f.subscriptions.reconcilePayment('pay_first');
  assert.equal((await f.store.get('lessons', lesson.id))!.status, 'CANCELLED');
  assert.equal((await f.store.get('room_closures', lesson.id))!.status, 'PENDING');
  assert.equal(
    (await f.store.get('booking_days', `teacher_${f.booking.scheduledDate}`))!.slots.length,
    0,
  );
  f.gateway.payments.get('pay_first')!.status = 'RECEIVED';
  await f.subscriptions.reconcilePayment('pay_first');
  assert.equal((await f.store.get('subscriptions', 'sub_student'))!.status, 'REVIEW');
  assert.equal((await f.subscriptions.summary(student))[0].cycles[0].remaining, 0);
  await assert.rejects(() => f.book('11:00'));
});
test('checkout creation is fenced, priced on server, linked through provider checkout filter and credited after confirmation', async () => {
  const f = await subscriptionFixture(false),
    retryKey = randomUUID();
  await f.subscriptions.checkout(
    student,
    { planId: 'monthly-4', studentId: student.uid },
    retryKey,
  );
  await f.subscriptions.checkout(
    student,
    { planId: 'monthly-4', studentId: student.uid },
    retryKey,
  );
  assert.equal(f.gateway.checkoutCalls, 1);
  assert.equal((await f.subscriptions.summary(student)).length, 0);
  assert.equal((await f.subscriptions.reconcileCheckouts()).failures, 0);
  f.gateway.checkoutRows = [f.payment];
  assert.equal((await f.subscriptions.reconcileCheckouts()).failures, 0);
  assert.equal((await f.subscriptions.summary(student))[0].cycles[0].remaining, 4);
});
test('checkout timeout is not retried automatically or replaced by another key', async () => {
  const f = await subscriptionFixture(false);
  f.gateway.failCheckout = true;
  const input = { planId: 'monthly-4', studentId: student.uid },
    retryKey = randomUUID();
  await assert.rejects(() => f.subscriptions.checkout(student, input, retryKey));
  await assert.rejects(() => f.subscriptions.checkout(student, input, retryKey));
  await assert.rejects(() => f.subscriptions.checkout(student, input, randomUUID()));
  assert.equal(f.gateway.checkoutCalls, 1);
});
test('subscription APIs reject forged amounts, unauthenticated sessions, wrong account webhooks and non-admin recipients', async () => {
  const f = await appFixture(false);
  await request(f.app).get('/api/subscriptions').expect(401);
  await request(f.app)
    .post('/api/subscriptions/checkout')
    .set('Authorization', 'Bearer student')
    .send({ planId: 'monthly-16', studentId: 'student', amountCents: 1, creditCard: {} })
    .expect(400);
  await request(f.app)
    .post('/api/admin/subscriptions/recipients/teacher')
    .set('Authorization', 'Bearer teacher')
    .send({ walletId: wallet, verified: true, evidence: 'Homologação realizada' })
    .expect(403);
  const event = {
    id: 'evt_one&10',
    event: 'PAYMENT_RECEIVED',
    account: { id: account },
    payment: { id: 'pay_first', creditCard: 'do-not-store' },
  };
  await request(f.app).post('/api/subscriptions/asaas/webhook').send(event).expect(401);
  await request(f.app)
    .post('/api/subscriptions/asaas/webhook')
    .set('asaas-access-token', f.config.asaasWebhookToken)
    .send({ ...event, account: { id: wallet } })
    .expect(401);
  for (let i = 0; i < 2; i++)
    await request(f.app)
      .post('/api/subscriptions/asaas/webhook')
      .set('asaas-access-token', f.config.asaasWebhookToken)
      .send(event)
      .expect(200);
  const events = await f.store.find('asaas_events', 'status', 'PENDING');
  assert.equal(events.length, 1);
  assert.equal(JSON.stringify(events).includes('do-not-store'), false);
  await f.subscriptions.bind(admin, f.binding);
  assert.equal((await f.subscriptions.drainEvents()).failures, 0);
  assert.equal((await f.store.find('asaas_events', 'status', 'PROCESSED')).length, 1);
  assert.equal((await f.subscriptions.summary(other)).length, 0);
});
test('cancellation stops provider renewal idempotently and privacy deletion is blocked while billing is active', async () => {
  const f = await subscriptionFixture(),
    privacy = new PrivacyService(f.platform);
  const deletion = await privacy.request(student, student.uid, 'DELETION', 'Excluir minha conta');
  await assert.rejects(() =>
    privacy.fulfillDeletion(admin, deletion.id, 'Manter registros financeiros obrigatórios'),
  );
  await assert.rejects(() => f.subscriptions.cancel(other, 'sub_student'));
  await f.subscriptions.cancel(student, 'sub_student');
  await f.subscriptions.cancel(student, 'sub_student');
  assert.equal(f.gateway.subscriptions.get('sub_student')!.status, 'INACTIVE');
  const exported = await privacy.export(student, student.uid);
  assert.equal(exported.subscriptions.length, 1);
  assert.equal(exported.subscriptionPayments.length, 1);
  assert.equal(JSON.stringify(exported).includes('cus_student'), false);
});

test('privacy deletion cannot discard an unconfirmed completed lesson after renewal is cancelled', async () => {
  const f = await subscriptionFixture();
  const lesson = await f.book();
  f.advance(lesson.scheduledAt + 50 * 60_000 - f.platform.now());
  await f.platform.complete(teacher, lesson.id);
  await f.subscriptions.cancel(student, 'sub_student');
  const privacy = new PrivacyService(f.platform);
  const deletion = await privacy.request(student, student.uid, 'DELETION', 'Excluir minha conta');
  await assert.rejects(() =>
    privacy.fulfillDeletion(admin, deletion.id, 'Reter provas financeiras'),
  );
  assert.equal((await f.store.get('profiles', student.uid))!.status, 'ACTIVE');
  assert.equal((await f.store.find('subscription_payouts', 'lessonId', lesson.id)).length, 0);
});

test('chargeback closes an ongoing lesson and releases its schedule holds', async () => {
  const f = await subscriptionFixture();
  const lesson = await f.book();
  await f.store.transaction(async (tx) => tx.set('lessons', { ...lesson, status: 'IN_PROGRESS' }));
  f.gateway.payments.get('pay_first')!.status = 'CHARGEBACK_REQUESTED';
  await f.subscriptions.reconcilePayment('pay_first');
  assert.equal((await f.store.get('lessons', lesson.id))!.status, 'CANCELLED');
  assert.equal((await f.store.get('room_closures', lesson.id))!.status, 'PENDING');
  for (const uid of [lesson.teacherId, lesson.studentId]) {
    const day = await f.store.get('booking_days', `${uid}_${lesson.scheduledDate}`);
    assert.equal(
      day!.slots.some((slot: any) => slot.lessonId === lesson.id),
      false,
    );
  }
});

test('recipients verified for another account cannot reserve credits or receive transfers', async () => {
  const f = await subscriptionFixture();
  const recipient = (await f.store.get('asaas_recipients', 'teacher'))!;
  await f.store.transaction(async (tx) =>
    tx.set('asaas_recipients', { ...recipient, accountId: wallet }),
  );
  await assert.rejects(() => f.book());
  await f.store.transaction(async (tx) => tx.set('asaas_recipients', recipient));
  const lesson = await f.book();
  f.advance(lesson.scheduledAt + 50 * 60_000 - f.platform.now());
  await f.platform.complete(teacher, lesson.id);
  f.gateway.available = 0;
  await f.subscriptions.confirmCompletion(student, lesson.id);
  await f.store.transaction(async (tx) =>
    tx.set('asaas_recipients', { ...recipient, accountId: wallet }),
  );
  f.gateway.available = 100_000;
  await f.subscriptions.processQueued();
  assert.equal(f.gateway.sendCalls, 0);
});

test('expired carryover is unavailable even without renewal and renewal does not extend the old batch', async () => {
  const f = await subscriptionFixture();
  const expiry = addCalendarMonths(f.dueDate, 2);
  f.advance(Date.parse(`${expiry}T03:00:00Z`) - f.platform.now());
  assert.equal((await f.subscriptions.summary(student))[0].cycles[0].remaining, 0);
  await assert.rejects(() =>
    f.store.transaction((tx) =>
      f.subscriptions.reserve(tx, student, 'sub_student', {
        id: 'late',
        studentId: 'student',
        teacherId: 'teacher',
        scheduledDate: expiry,
      }),
    ),
  );
  const next = { ...f.payment, id: 'pay_next', dueDate: addCalendarMonths(f.dueDate, 1) };
  f.gateway.payments.set(next.id, next);
  await f.subscriptions.reconcilePayment(next.id);
  const original = (
    await f.store.find('subscription_cycles', 'subscriptionId', 'sub_student')
  ).find((c) => c.paymentId === 'pay_first')!;
  assert.equal(original.expiresOn, expiry);
});
test('provider webhook recovers an uncertain transfer by reference without another submission', async () => {
  const f = await subscriptionFixture();
  f.gateway.failSend = true;
  const lesson = await f.book();
  f.advance(lesson.scheduledAt + 50 * 60_000 - f.platform.now());
  await f.platform.complete(teacher, lesson.id);
  await f.subscriptions.confirmCompletion(student, lesson.id);
  await f.subscriptions.receiveEvent({
    id: 'evt_transfer',
    event: 'TRANSFER_DONE',
    account: { id: account },
    transfer: { id: 'transfer_1' },
  });
  assert.equal((await f.subscriptions.drainEvents()).failures, 0);
  const payout = (await f.store.find('subscription_payouts', 'lessonId', lesson.id))[0];
  assert.equal(payout.status, 'DONE');
  assert.equal(payout.transferId, 'transfer_1');
  assert.equal(payout.reviewRequired, true);
  assert.equal(f.gateway.sendCalls, 1);
});
test('recipient changes, wrong-wallet transfers and chargebacks after completion require review', async () => {
  const f = await subscriptionFixture();
  f.gateway.available = 0;
  const lesson = await f.book();
  f.advance(lesson.scheduledAt + 50 * 60_000 - f.platform.now());
  await f.platform.complete(teacher, lesson.id);
  await f.subscriptions.confirmCompletion(student, lesson.id);
  await f.store.transaction(async (tx) =>
    tx.set('asaas_recipients', {
      id: 'teacher',
      walletId: account,
      verified: true,
      accountId: account,
    }),
  );
  f.gateway.available = 100_000;
  await f.subscriptions.processQueued();
  assert.equal(f.gateway.sendCalls, 0);
  await f.store.transaction(async (tx) =>
    tx.set('asaas_recipients', {
      id: 'teacher',
      walletId: wallet,
      verified: true,
      accountId: account,
    }),
  );
  await f.subscriptions.processQueued();
  assert.equal(f.gateway.sendCalls, 1);
  f.gateway.transfers.get('transfer_1')!.walletId = account;
  await assert.rejects(() => f.subscriptions.reconcileTransfer('transfer_1'));
  f.gateway.payments.get('pay_first')!.status = 'REFUNDED';
  await f.subscriptions.reconcilePayment('pay_first');
  const payout = (await f.store.find('subscription_payouts', 'lessonId', lesson.id))[0];
  assert.equal(payout.status, 'DONE');
  assert.equal(payout.reviewRequired, true);
});
test('sandbox HTTP flow checks admin binding, recipient evidence, scoped balance, booking and renewal cancellation', async () => {
  const f = await appFixture(false);
  await request(f.app)
    .post('/api/admin/subscriptions/bind')
    .set('Authorization', 'Bearer admin')
    .send(f.binding)
    .expect(200);
  await request(f.app)
    .post('/api/admin/subscriptions/recipients/teacher')
    .set('Authorization', 'Bearer admin')
    .send({
      walletId: wallet,
      verified: true,
      evidence: 'Conta vinculada verificada na homologação',
    })
    .expect(200);
  await f.subscriptions.receiveEvent({
    id: 'evt_paid',
    event: 'PAYMENT_RECEIVED',
    account: { id: account },
    payment: { id: 'pay_first' },
  });
  await request(f.app)
    .post('/api/admin/subscriptions/reconcile')
    .set('Authorization', 'Bearer admin')
    .send({})
    .expect(200);
  const summary = await request(f.app)
    .get('/api/subscriptions')
    .set('Authorization', 'Bearer student')
    .expect(200);
  assert.equal(summary.body[0].cycles[0].remaining, 4);
  const booked = await request(f.app)
    .post('/api/subscriptions/sub_student/bookings')
    .set({ Authorization: 'Bearer student', 'Idempotency-Key': randomUUID() })
    .send(f.booking)
    .expect(201);
  f.advance(booked.body.scheduledAt + 50 * 60_000 - f.platform.now());
  await request(f.app)
    .post(`/api/lessons/${booked.body.id}/complete`)
    .set('Authorization', 'Bearer teacher')
    .send({})
    .expect(200);
  await request(f.app)
    .post(`/api/lessons/${booked.body.id}/confirm-completion`)
    .set('Authorization', 'Bearer student')
    .send({})
    .expect(200);
  assert.equal(f.gateway.sendCalls, 1);
  await request(f.app)
    .post('/api/subscriptions/sub_student/cancel')
    .set('Authorization', 'Bearer student')
    .send({})
    .expect(200);
  assert.equal((await request(f.app).get('/api/config')).body.subscriptionsEnabled, false);
});
test('minors receive a plan only through the verified guardian relationship', async () => {
  const f = await subscriptionFixture(false);
  const dependent = await f.platform.dependent(guardian, {
    name: 'Dependente',
    birthDate: '2016-01-01',
    guardianDeclaration: true,
    termsVersion: f.config.termsVersion,
  });
  await f.platform.approve(admin, 'guardian', dependent.id, 'Vínculo e idade verificados no teste');
  f.gateway.customers.get('cus_student')!.email = guardian.email;
  await assert.rejects(() =>
    f.subscriptions.bind(admin, { ...f.binding, studentId: dependent.id }),
  );
  await f.subscriptions.bind(admin, {
    ...f.binding,
    payerId: guardian.uid,
    studentId: dependent.id,
  });
  await f.subscriptions.reconcilePayment('pay_first');
  assert.equal((await f.subscriptions.summary(guardian))[0].studentId, dependent.id);
  await assert.rejects(() =>
    f.subscriptions.checkout(
      student,
      { planId: 'monthly-4', studentId: dependent.id },
      randomUUID(),
    ),
  );
});

test('maintenance recovers a missed renewal webhook and provider-side cancellation', async () => {
  const f = await subscriptionFixture();
  const next = { ...f.payment, id: 'pay_next', dueDate: addCalendarMonths(f.dueDate, 1) };
  f.gateway.payments.set(next.id, next);
  assert.equal((await f.subscriptions.drainEvents()).failures, 0);
  assert.equal(
    (await f.store.find('subscription_cycles', 'subscriptionId', 'sub_student')).length,
    2,
  );
  f.gateway.subscriptions.get('sub_student')!.status = 'INACTIVE';
  assert.equal((await f.subscriptions.drainEvents()).failures, 0);
  assert.equal((await f.store.get('subscriptions', 'sub_student'))!.status, 'CANCELLED');
});
