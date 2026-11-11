import { after, before, test } from 'node:test';
import nodeAssert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  initializeTestEnvironment,
  assertFails,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { FirestoreStore } from '../../src/server/store';
import { Platform } from '../../src/server/platform';
import { readConfig } from '../../src/server/config';
import { FakeGateway, student, teacher, other } from '../support/fixture';
import { randomUUID } from 'node:crypto';
import { MonthlySubscriptions } from '../../src/server/subscriptions';
import { subscriptionFixture } from '../support/subscription-fixture';
import { fixture } from '../support/fixture';
import { VideoService } from '../../src/server/video';
let env: RulesTestEnvironment;
before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-talke',
    firestore: { host: '127.0.0.1', port: 8080, rules: await readFile('firestore.rules', 'utf8') },
  });
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'students/student'), {
      id: 'student',
      walletBalanceBrl: 0,
    });
  });
});

test('Firestore transaction prevents two non-overlapping lessons from spending the final subscription credit', async () => {
  const f = await subscriptionFixture();
  const firebase = initializeApp({ projectId: 'demo-talke' }, 'subscription-rules-adapter');
  try {
    const store = new FirestoreStore(getFirestore(firebase));
    const cycle = (await f.store.find('subscription_cycles', 'subscriptionId', 'sub_student'))[0];
    const copies: [string, string][] = [
      ['profiles', 'student'],
      ['profiles', 'teacher'],
      ['students', 'student'],
      ['teachers', 'teacher'],
      ['asaas_recipients', 'teacher'],
      ['subscriptions', 'sub_student'],
      ['asaas_payments', 'pay_first'],
    ];
    await store.transaction(async (tx) => {
      for (const [collection, id] of copies)
        tx.set(collection, (await f.store.get(collection, id))!);
      tx.set('subscription_cycles', { ...cycle, remaining: 1 });
    });
    const platform = new Platform(store, f.config, new FakeGateway(), f.platform.now);
    const subscriptions = new MonthlySubscriptions(platform, f.gateway);
    const results = await Promise.allSettled(
      ['10:00', '11:00'].map((startTime) =>
        platform.booking(student, { ...f.booking, startTime }, randomUUID(), {
          subscriptions,
          subscriptionId: 'sub_student',
        }),
      ),
    );
    if (results.filter((r) => r.status === 'fulfilled').length !== 1)
      throw new Error('Expected exactly one funded lesson');
    if ((await store.get('subscription_cycles', cycle.id))!.remaining !== 0)
      throw new Error('Final subscription credit was not consumed atomically');
  } finally {
    await deleteApp(firebase);
  }
});
after(async () => {
  await env.cleanup();
});

test('Firestore serializes competing Meet link claims across different paid lessons', async () => {
  const f = await fixture();
  f.config.videoProvider = 'google_meet';
  const firebase = initializeApp({ projectId: 'demo-talke' }, 'meet-claim-race');
  try {
    const store = new FirestoreStore(getFirestore(firebase));
    await store.transaction(async (tx) => {
      tx.set('profiles', (await f.store.get('profiles', 'teacher'))!);
      tx.set('teachers', (await f.store.get('teachers', 'teacher'))!);
      for (const id of ['meet-race-first', 'meet-race-second'])
        tx.set('lessons', {
          id,
          teacherId: 'teacher',
          studentId: 'student',
          payerId: 'student',
          status: 'CONFIRMED',
          isPaid: true,
          scheduledAt: f.platform.now() + 3_600_000,
          durationMinutes: 50,
        });
    });
    const service = new VideoService(store, f.config, () => f.platform.now());
    const results = await Promise.allSettled(
      ['meet-race-first', 'meet-race-second'].map((id) =>
        service.setMeetLink('teacher', id, {
          url: 'https://meet.google.com/xyz-abcd-efg',
          hostControlsConfirmed: true,
        }),
      ),
    );
    nodeAssert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
    const rows = await Promise.all(
      ['meet-race-first', 'meet-race-second'].map((id) => store.get('lesson_video_links', id)),
    );
    nodeAssert.equal(rows.filter(Boolean).length, 1);
  } finally {
    await deleteApp(firebase);
  }
});
for (const identity of ['anonymous', 'student', 'teacher', 'admin']) {
  test(identity + ' cannot read or mutate private application collections directly', async () => {
    const db =
      identity === 'anonymous'
        ? env.unauthenticatedContext().firestore()
        : env.authenticatedContext(identity, { admin: identity === 'admin' }).firestore();
    for (const name of [
      'students',
      'teachers',
      'profiles',
      'lessons',
      'payments',
      'orders',
      'seller_credentials',
      'notifications',
      'student_progress',
      'privacy_requests',
      'safety_reports',
      'subscriptions',
      'subscription_cycles',
      'subscription_reservations',
      'subscription_payouts',
      'asaas_events',
      'asaas_payments',
      'asaas_recipients',
      'asaas_customers',
      'asaas_checkouts',
      'lesson_video_links',
      'meet_link_claims',
    ]) {
      await assertFails(getDoc(doc(db, name + '/student')));
      await assertFails(
        setDoc(doc(db, name + '/student'), { isPaid: true, walletBalanceBrl: 999 }),
      );
      await assertFails(getDocs(collection(db, name)));
    }
  });
}
test('Admin Firestore adapter stages all writes and serializes competing interval reservations', async () => {
  const firebase = initializeApp({ projectId: 'demo-talke' }, 'rules-adapter');
  try {
    const store = new FirestoreStore(getFirestore(firebase));
    const config = readConfig({
      NODE_ENV: 'test',
      FIREBASE_PROJECT_ID: 'demo-talke',
      PAYMENTS_ENABLED: 'true',
    });
    const platform = new Platform(store, config, new FakeGateway());
    for (const [actor, type] of [
      [student, 'STUDENT'],
      [teacher, 'TEACHER'],
      [other, 'STUDENT'],
    ] as const)
      await platform.register(actor, {
        name: actor.uid,
        birthDate: '1990-01-01',
        accountType: type,
        acceptedTerms: true,
        termsVersion: config.termsVersion,
      });
    const date = new Date(Date.now() + 3 * 86400_000).toISOString().slice(0, 10);
    await platform.updateTeacher(teacher, {
      headline: 'Professor',
      bio: 'Professor com experiência em inglês.',
      hourlyPriceBrl: 100,
      levelsTaught: [1],
      specialties: [],
      languages: ['Inglês'],
      certifications: [],
      availability: [
        {
          id: 'slot',
          dayOfWeek: new Date(date + 'T12:00:00Z').getUTCDay(),
          dayLabel: 'Disponível',
          startTime: '09:00',
          endTime: '18:00',
          isAvailable: true,
        },
      ],
    });
    await store.transaction(async (tx) => {
      const row = await tx.get('teachers', 'teacher');
      tx.set('teachers', { ...row!, isVerified: true, paymentConnected: true });
      tx.set('seller_credentials', { id: 'teacher', sellerId: '99' });
    });
    const input = {
      studentId: 'student',
      teacherId: 'teacher',
      scheduledDate: date,
      startTime: '10:00',
      topic: '',
    };
    const results = await Promise.allSettled([
      platform.booking(student, input, randomUUID()),
      platform.booking(other, { ...input, studentId: 'other', startTime: '10:30' }, randomUUID()),
    ]);
    if (results.filter((r) => r.status === 'fulfilled').length !== 1)
      throw new Error('Expected one successful reservation; ' + JSON.stringify(results));
    await store
      .transaction(async (tx) => {
        tx.set('rollback_probe', { id: 'probe' });
        throw new Error('abort');
      })
      .catch(() => {});
    if (await store.get('rollback_probe', 'probe'))
      throw new Error('Aborted transaction committed');
    await store.transaction(async (tx) => {
      for (const id of ['a', 'b', 'c']) tx.set('page_probe', { id, status: 'PENDING' });
      tx.set('page_probe', { id: 'd', status: 'DONE' });
    });
    const first = await store.findPage('page_probe', 'status', 'PENDING', undefined, 2);
    if (first.map((row) => row.id).join(',') !== 'a,b') throw new Error('Wrong first page');
    const next = await store.findPage('page_probe', 'status', 'PENDING', first.at(-1)!.id, 2);
    if (next.map((row) => row.id).join(',') !== 'c') throw new Error('Wrong continuation page');
    await store.transaction(async (tx) => tx.remove('page_probe', 'b'));
    if ((await store.findPage('page_probe', 'status', 'PENDING', 'b', 2))[0].id !== 'c')
      throw new Error('Deleted cursor document broke pagination');
    await nodeAssert.rejects(() =>
      store.findPage('page_probe', 'status', 'PENDING', undefined, 101),
    );
  } finally {
    await deleteApp(firebase);
  }
});
