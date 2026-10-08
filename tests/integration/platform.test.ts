import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixture, student, teacher, other, guardian, admin } from '../support/fixture';
import { PrivacyService } from '../../src/server/privacy';
import { randomUUID } from 'node:crypto';

test('booking derives price, split and duration on the server; wallets stay unchanged', async () => {
  const f = await fixture(),
    lesson = await f.platform.booking(student, f.booking, randomUUID());
  assert.equal(lesson.priceBrl, 100);
  assert.equal(lesson.platformFeeBrl, 15);
  assert.equal(lesson.teacherNetBrl, 85);
  assert.equal(lesson.durationMinutes, 50);
  assert.equal(lesson.isPaid, false);
  assert.equal(lesson.status, 'REQUESTED');
  assert.equal((await f.store.get('students', student.uid))?.walletBalanceBrl, 0);
  await assert.rejects(() =>
    f.platform.booking(student, { ...f.booking, priceBrl: 1, isPaid: true }, randomUUID()),
  );
});
test('parallel requests cannot book an overlapping teacher interval', async () => {
  const f = await fixture();
  const results = await Promise.allSettled([
    f.platform.booking(student, f.booking, randomUUID()),
    f.platform.booking(
      other,
      { ...f.booking, studentId: other.uid, startTime: '10:30' },
      randomUUID(),
    ),
  ]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal((await f.store.find('lessons', 'teacherId', teacher.uid)).length, 1);
});
test('adjacent intervals are allowed and cancelled intervals are released', async () => {
  const f = await fixture(),
    first = await f.platform.booking(student, f.booking, randomUUID());
  await f.platform.booking(
    other,
    { ...f.booking, studentId: other.uid, startTime: '10:50' },
    randomUUID(),
  );
  await f.platform.cancel(student, first.id);
  const retry = await f.platform.booking(student, f.booking, randomUUID());
  assert.equal(retry.status, 'REQUESTED');
});
test('repeated booking key returns same reservation and conflicting payload is rejected', async () => {
  const f = await fixture(),
    key = randomUUID();
  const first = await f.platform.booking(student, f.booking, key),
    second = await f.platform.booking(student, f.booking, key);
  assert.equal(first.id, second.id);
  assert.equal((await f.store.find('orders', 'payerId', student.uid)).length, 1);
  await assert.rejects(() =>
    f.platform.booking(student, { ...f.booking, startTime: '12:00' }, key),
  );
});
test('cannot book another student, unverified teacher, unavailable time or invalid date', async () => {
  const f = await fixture();
  await assert.rejects(() => f.platform.booking(other, f.booking, randomUUID()));
  for (const input of [
    { ...f.booking, scheduledDate: '2027-02-30' },
    { ...f.booking, startTime: '25:00' },
    { ...f.booking, startTime: '20:00' },
    { ...f.booking, scheduledDate: '2020-01-01' },
  ])
    await assert.rejects(() => f.platform.booking(student, input, randomUUID()));
  await f.store.transaction(async (tx) => {
    const row = await tx.get('teachers', teacher.uid);
    tx.set('teachers', { ...row!, isVerified: false });
  });
  await assert.rejects(() => f.platform.booking(student, f.booking, randomUUID()));
});
test('checkout is hosted, owner-scoped and reused without confirming payment', async () => {
  const f = await fixture(),
    lesson = await f.platform.booking(student, f.booking, randomUUID());
  await assert.rejects(() => f.platform.checkout(other, lesson.id));
  const first = await f.platform.checkout(student, lesson.id),
    second = await f.platform.checkout(student, lesson.id);
  assert.equal(first.url, second.url);
  assert.equal(f.gateway.checkoutCalls, 1);
  assert.equal((await f.store.get('lessons', lesson.id))?.isPaid, false);
});
test('authoritative approval is atomic and repeat delivery never double counts or debits', async () => {
  const f = await fixture(),
    lesson = await f.platform.booking(student, f.booking, randomUUID()),
    order = (await f.store.get('orders', lesson.id))!;
  f.gateway.approve(order);
  await Promise.all([
    f.platform.reconcilePayment('123', '99'),
    f.platform.reconcilePayment('123', '99'),
  ]);
  assert.equal((await f.store.get('lessons', lesson.id))?.status, 'CONFIRMED');
  assert.equal((await f.store.get('orders', lesson.id))?.status, 'PAID');
  assert.equal((await f.store.find('payments', 'orderId', order.id)).length, 1);
  assert.equal((await f.store.get('students', student.uid))?.walletBalanceBrl, 0);
});
test('mismatched amount, collector, currency, mode and commission cannot approve a reservation', async () => {
  for (const change of [
    { transaction_amount: 1 },
    { collector_id: 100 },
    { currency_id: 'USD' },
    { live_mode: true },
    { fee_details: [] },
  ]) {
    const f = await fixture(),
      lesson = await f.platform.booking(student, f.booking, randomUUID()),
      payment = f.gateway.approve((await f.store.get('orders', lesson.id))!);
    f.gateway.payments.set('123', { ...payment, ...change });
    await assert.rejects(() => f.platform.reconcilePayment('123', '99'));
    assert.equal((await f.store.get('lessons', lesson.id))?.isPaid, false);
  }
});
test('pending and rejected provider responses never approve a lesson', async () => {
  const f = await fixture(),
    lesson = await f.platform.booking(student, f.booking, randomUUID()),
    payment = f.gateway.approve((await f.store.get('orders', lesson.id))!);
  for (const status of ['pending', 'rejected']) {
    f.gateway.payments.set('123', { ...payment, status });
    await f.platform.reconcilePayment('123', '99');
    assert.equal((await f.store.get('lessons', lesson.id))?.isPaid, false);
  }
});
test('late approvals and duplicate payments are refunded without granting access', async () => {
  const f = await fixture(),
    lesson = await f.platform.booking(student, f.booking, randomUUID()),
    order = (await f.store.get('orders', lesson.id))!;
  f.gateway.approve(order);
  f.advance(31 * 60_000);
  await f.platform.reconcilePayment('123', '99');
  assert.deepEqual(f.gateway.refunds, ['123']);
  assert.equal((await f.store.get('lessons', lesson.id))?.isPaid, false);
  const g = await fixture(),
    l = await g.platform.booking(student, g.booking, randomUUID()),
    o = (await g.store.get('orders', l.id))!;
  g.gateway.approve(o);
  await g.platform.reconcilePayment('123', '99');
  g.gateway.approve(o, '456');
  await g.platform.reconcilePayment('456', '99');
  assert.deepEqual(g.gateway.refunds, ['456']);
  assert.equal((await g.store.get('orders', l.id))?.paymentId, '123');
});
test('cancel requests a real refund and only provider confirmation marks refunded', async () => {
  const f = await fixture(),
    lesson = await f.platform.booking(student, f.booking, randomUUID()),
    payment = f.gateway.approve((await f.store.get('orders', lesson.id))!);
  await f.platform.reconcilePayment('123', '99');
  await f.platform.cancel(student, lesson.id);
  await f.platform.cancel(student, lesson.id);
  assert.deepEqual(f.gateway.refunds, ['123']);
  assert.equal((await f.store.get('orders', lesson.id))?.status, 'REFUND_PENDING');
  f.gateway.payments.set('123', {
    ...payment,
    status: 'refunded',
    date_last_updated: new Date(Date.now() + 1000).toISOString(),
  });
  await f.platform.reconcilePayment('123', '99');
  assert.equal((await f.store.get('orders', lesson.id))?.status, 'REFUNDED');
});
test('refund failures are retained for support instead of reporting a false success', async () => {
  const f = await fixture(),
    lesson = await f.platform.booking(student, f.booking, randomUUID());
  f.gateway.approve((await f.store.get('orders', lesson.id))!);
  await f.platform.reconcilePayment('123', '99');
  f.gateway.failRefund = true;
  await assert.rejects(() => f.platform.cancel(student, lesson.id));
  assert.equal((await f.store.get('refunds', 'refund_123'))?.status, 'REQUIRES_SUPPORT');
});
test('only paid ended lessons can complete, and repeated completion increments once', async () => {
  const f = await fixture(),
    lesson = await f.platform.booking(student, f.booking, randomUUID());
  await assert.rejects(() => f.platform.complete(teacher, lesson.id));
  f.gateway.approve((await f.store.get('orders', lesson.id))!);
  await f.platform.reconcilePayment('123', '99');
  await assert.rejects(() => f.platform.complete(teacher, lesson.id));
  f.advance(4 * 86400_000);
  await assert.rejects(() => f.platform.complete(student, lesson.id));
  await f.platform.complete(teacher, lesson.id);
  await f.platform.complete(teacher, lesson.id);
  assert.equal((await f.store.get('students', student.uid))?.totalLessonsCompleted, 1);
  assert.equal((await f.store.get('teachers', teacher.uid))?.totalLessonsCompleted, 1);
  await assert.rejects(() => f.platform.cancel(student, lesson.id));
});
test('guardians must have approved links and cannot act on another family', async () => {
  const f = await fixture(),
    child = await f.platform.dependent(guardian, {
      name: 'Child',
      birthDate: '2016-01-01',
      guardianDeclaration: true,
      termsVersion: f.config.termsVersion,
    });
  const booking = { ...f.booking, studentId: child.id };
  await assert.rejects(() => f.platform.booking(guardian, booking, randomUUID()));
  await assert.rejects(() =>
    f.platform.approve(student, 'guardian', child.id, 'verified evidence reference'),
  );
  await f.platform.approve(admin, 'guardian', child.id, 'verified evidence reference');
  await assert.rejects(() => f.platform.booking(other, booking, randomUUID()));
  const lesson = await f.platform.booking(guardian, booking, randomUUID());
  assert.equal(lesson.payerId, guardian.uid);
});
test('minor cannot self-register; forged balance and role are rejected', async () => {
  const f = await fixture(),
    input = {
      name: 'New',
      birthDate: '2016-01-01',
      accountType: 'STUDENT',
      acceptedTerms: true,
      termsVersion: f.config.termsVersion,
    };
  await assert.rejects(() => f.platform.register({ ...other, uid: 'new' }, input));
  await assert.rejects(() =>
    f.platform.register(
      { ...other, uid: 'new' },
      { ...input, birthDate: '1990-01-01', walletBalanceBrl: 999 },
    ),
  );
  await assert.rejects(() =>
    f.platform.register(
      { ...other, uid: 'new' },
      { ...input, birthDate: '1990-01-01', accountType: 'ADMIN' },
    ),
  );
});
test('public teacher projection never contains teacher email or credentials', async () => {
  const f = await fixture(),
    rows = await f.platform.publicTeachers();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].email, '');
  assert.equal(JSON.stringify(rows).includes('teacher@example.test'), false);
  assert.equal(JSON.stringify(rows).includes('encrypted'), false);
});
test('reviews require completed own lessons and aggregate only once', async () => {
  const f = await fixture(),
    lesson = await f.platform.booking(student, f.booking, randomUUID());
  await assert.rejects(() => f.platform.review(student, lesson.id, 5, 'Review'));
  f.gateway.approve((await f.store.get('orders', lesson.id))!);
  await f.platform.reconcilePayment('123', '99');
  f.advance(4 * 86400_000);
  await f.platform.complete(teacher, lesson.id);
  await assert.rejects(() => f.platform.review(other, lesson.id, 5, 'Review'));
  await f.platform.review(student, lesson.id, 5, 'Review');
  await assert.rejects(() => f.platform.review(student, lesson.id, 5, 'Review'));
  assert.equal((await f.store.get('teachers', teacher.uid))?.totalReviews, 1);
});
test('privacy exports are subject-scoped and omit counterparty information', async () => {
  const f = await fixture(),
    privacy = new PrivacyService(f.platform);
  await f.platform.booking(student, f.booking, randomUUID());
  await assert.rejects(() => privacy.export(other, student.uid));
  const data = await privacy.export(student, student.uid);
  assert.equal(data.profile.id, student.uid);
  assert.equal(JSON.stringify(data).includes('teacher@example.test'), false);
});
test('deletion retains restricted financial records, deletes operational profile and blocks reuse', async () => {
  const f = await fixture(),
    privacy = new PrivacyService(f.platform);
  const request = await privacy.request(student, student.uid, 'DELETION', 'Please delete my data');
  await assert.rejects(() =>
    privacy.fulfillDeletion(
      other,
      request.id,
      'Financial retention required by applicable obligations',
    ),
  );
  await privacy.fulfillDeletion(
    admin,
    request.id,
    'Financial retention justified; no active lessons or outstanding debts',
  );
  assert.equal(await f.store.get('students', student.uid), null);
  assert.equal((await f.store.get('profiles', student.uid))?.status, 'DELETED');
  await assert.rejects(() => f.platform.me(student));
});
test('deletion with active reservations is rejected and leaves profile intact', async () => {
  const f = await fixture(),
    privacy = new PrivacyService(f.platform);
  await f.platform.booking(student, f.booking, randomUUID());
  const request = await privacy.request(student, student.uid, 'DELETION', 'Delete');
  await assert.rejects(() =>
    privacy.fulfillDeletion(
      admin,
      request.id,
      'Financial retention required by applicable obligations',
    ),
  );
  assert.equal((await f.store.get('profiles', student.uid))?.status, 'ACTIVE');
});
test('withdrawing guardian authorization blocks future reservations immediately', async () => {
  const f = await fixture(),
    child = await f.platform.dependent(guardian, {
      name: 'Child',
      birthDate: '2016-01-01',
      guardianDeclaration: true,
      termsVersion: f.config.termsVersion,
    });
  await f.platform.approve(admin, 'guardian', child.id, 'verified evidence reference');
  await new PrivacyService(f.platform).request(
    guardian,
    child.id,
    'CONSENT_WITHDRAWAL',
    'Withdraw',
  );
  await assert.rejects(() =>
    f.platform.booking(guardian, { ...f.booking, studentId: child.id }, randomUUID()),
  );
});
test('database outage never returns a fictitious saved reservation', async () => {
  const f = await fixture();
  f.store.offline = true;
  await assert.rejects(() => f.platform.booking(student, f.booking, randomUUID()));
  f.store.offline = false;
  assert.equal((await f.store.find('lessons', 'payerId', student.uid)).length, 0);
});
test('when minors are enabled every new adult awaits age review; suspended accounts cannot self-reactivate', async () => {
  const f = await fixture(),
    actor = { ...other, uid: 'new-adult' };
  const input = {
    name: 'New adult',
    birthDate: '1990-01-01',
    accountType: 'STUDENT',
    termsVersion: f.config.termsVersion,
    acceptedTerms: true,
  };
  const profile = await f.platform.register(actor, input);
  assert.equal(profile.status, 'PENDING_AGE_REVIEW');
  await assert.rejects(() =>
    f.platform.booking(actor, { ...f.booking, studentId: actor.uid }, randomUUID()),
  );
  await f.platform.approve(
    admin,
    'age',
    actor.uid,
    'Aferição efetiva registrada em evidência controlada',
  );
  assert.equal((await f.platform.ready(actor)).status, 'ACTIVE');
  await f.store.transaction(async (tx) => {
    const row = await tx.get('profiles', actor.uid);
    tx.set('profiles', { ...row!, status: 'SUSPENDED' });
  });
  await assert.rejects(() => f.platform.register(actor, input));
  assert.equal((await f.store.get('profiles', actor.uid))?.status, 'SUSPENDED');
});
test('changing verified identity requires fresh review and cannot carry forward age proof', async () => {
  const f = await fixture();
  await f.platform.register(student, {
    name: 'Changed',
    birthDate: '1990-01-01',
    accountType: 'STUDENT',
    termsVersion: f.config.termsVersion,
    acceptedTerms: true,
  });
  const row = (await f.store.get('profiles', student.uid))!;
  assert.equal(row.status, 'PENDING_AGE_REVIEW');
  assert.equal(row.ageVerifiedAt, undefined);
});
test('reconciliation recovers missing webhooks and retries refund failures', async () => {
  const f = await fixture(),
    lesson = await f.platform.booking(student, f.booking, randomUUID());
  f.gateway.approve((await f.store.get('orders', lesson.id))!);
  await f.platform.reconcileOrder(lesson.id);
  assert.equal((await f.store.get('lessons', lesson.id))?.isPaid, true);
  f.gateway.failRefund = true;
  await assert.rejects(() => f.platform.cancel(student, lesson.id));
  f.gateway.failRefund = false;
  await f.platform.reconcileOrder(lesson.id);
  assert.deepEqual(f.gateway.refunds, ['123']);
});
test('refund/chargeback terminal state cannot be overwritten by an older approval', async () => {
  const f = await fixture(),
    lesson = await f.platform.booking(student, f.booking, randomUUID()),
    payment = f.gateway.approve((await f.store.get('orders', lesson.id))!);
  await f.platform.reconcilePayment('123', '99');
  f.gateway.payments.set('123', { ...payment, status: 'charged_back' });
  await f.platform.reconcilePayment('123', '99');
  f.gateway.payments.set('123', payment);
  await f.platform.reconcilePayment('123', '99');
  assert.equal((await f.store.get('orders', lesson.id))?.status, 'DISPUTED');
  assert.equal((await f.store.get('lessons', lesson.id))?.isPaid, false);
});
test('partial refund suspends access and creates an explicit support case', async () => {
  const f = await fixture(),
    lesson = await f.platform.booking(student, f.booking, randomUUID()),
    payment = f.gateway.approve((await f.store.get('orders', lesson.id))!);
  await f.platform.reconcilePayment('123', '99');
  f.gateway.payments.set('123', {
    ...payment,
    transaction_amount_refunded: 20,
    date_last_updated: new Date(Date.now() + 1000).toISOString(),
  });
  await f.platform.reconcilePayment('123', '99');
  assert.equal((await f.store.get('orders', lesson.id))?.status, 'PARTIAL_REFUND_REVIEW');
  assert.equal((await f.store.get('lessons', lesson.id))?.isPaid, false);
  assert.equal((await f.store.get('refunds', 'refund_123'))?.status, 'REQUIRES_SUPPORT');
});
test('teacher deletion removes public profile but preserves encrypted authority needed for existing financial obligations', async () => {
  const f = await fixture(),
    lesson = await f.platform.booking(student, f.booking, randomUUID());
  f.gateway.approve((await f.store.get('orders', lesson.id))!);
  await f.platform.reconcilePayment('123', '99');
  f.advance(4 * 86400_000);
  await f.platform.complete(teacher, lesson.id);
  const privacy = new PrivacyService(f.platform),
    request = await privacy.request(teacher, teacher.uid, 'DELETION', 'Delete my profile');
  await privacy.fulfillDeletion(
    admin,
    request.id,
    'Retain encrypted gateway authorization solely for existing refund and dispute obligations, pending approved retention deadline',
  );
  assert.equal(await f.store.get('teachers', teacher.uid), null);
  assert.equal(await f.store.get('seller_credentials', teacher.uid), null);
  assert.equal((await f.store.get('retained_seller_credentials', teacher.uid))?.sellerId, '99');
  await assert.rejects(() =>
    f.platform.booking(other, { ...f.booking, studentId: other.uid }, randomUUID()),
  );
});
test('teacher approval requires an active verified profile and public changes invalidate approval', async () => {
  const f = await fixture(),
    profile = await f.store.get('teachers', teacher.uid);
  await f.platform.updateTeacher(teacher, {
    headline: 'New public claims',
    bio: 'A newly edited public teaching biography.',
    hourlyPriceBrl: 100,
    levelsTaught: [1],
    specialties: [],
    languages: ['Inglês'],
    certifications: [],
    availability: profile!.availability,
  });
  assert.equal((await f.platform.publicTeachers()).length, 0);
  await assert.rejects(() =>
    f.platform.approve(other, 'teacher', teacher.uid, 'Documentary review evidence'),
  );
  await f.platform.approve(admin, 'teacher', teacher.uid, 'Documentary review evidence');
  assert.equal((await f.platform.publicTeachers()).length, 1);
  await f.store.transaction(async (tx) => {
    const row = await tx.get('profiles', teacher.uid);
    tx.set('profiles', { ...row!, status: 'PENDING_AGE_REVIEW' });
  });
  assert.equal((await f.platform.publicTeachers()).length, 0);
  await assert.rejects(() =>
    f.platform.approve(admin, 'teacher', teacher.uid, 'Documentary review evidence'),
  );
});
