import { after, before, test } from 'node:test';
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
after(async () => {
  await env.cleanup();
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
  } finally {
    await deleteApp(firebase);
  }
});
