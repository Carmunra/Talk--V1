import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Auth, UserRecord } from 'firebase-admin/auth';
import { parseAdminArguments, setAdminPermission } from '../../scripts/admin-permissions';

function fixture(overrides: Partial<UserRecord> = {}) {
  const user = {
    uid: 'primary-admin',
    email: 'owner@example.test',
    emailVerified: true,
    disabled: false,
    customClaims: { teacher: true },
    ...overrides,
  } as UserRecord;
  const calls: unknown[] = [];
  const auth: Pick<
    Auth,
    'getUser' | 'getUserByEmail' | 'setCustomUserClaims' | 'revokeRefreshTokens'
  > = {
    async getUser(uid) {
      calls.push(['uid', uid]);
      return user;
    },
    async getUserByEmail(email) {
      calls.push(['email', email]);
      return user;
    },
    async setCustomUserClaims(uid, claims) {
      calls.push(['claims', uid, claims]);
    },
    async revokeRefreshTokens(uid) {
      calls.push(['revoke', uid]);
    },
  };
  return { auth, calls };
}

test('admin grant resolves verified email on the server, preserves claims and revokes sessions', async () => {
  const f = fixture();
  await setAdminPermission(f.auth, ['--email', 'owner@example.test', 'grant']);
  assert.deepEqual(f.calls, [
    ['email', 'owner@example.test'],
    ['claims', 'primary-admin', { teacher: true, admin: true }],
    ['revoke', 'primary-admin'],
  ]);
});

test('UID-based admin command remains supported', async () => {
  const f = fixture();
  await setAdminPermission(f.auth, ['primary-admin', 'grant']);
  assert.deepEqual(f.calls[0], ['uid', 'primary-admin']);
});

test('admin grant rejects unverified, disabled or mismatched email before changing claims', async () => {
  for (const overrides of [
    { emailVerified: false },
    { disabled: true },
    { email: 'other@example.test' },
  ]) {
    const f = fixture(overrides);
    await assert.rejects(setAdminPermission(f.auth, ['--email', 'owner@example.test', 'grant']));
    assert.equal(f.calls.length, 1);
  }
});

test('admin revocation still works on disabled or unverified accounts', async () => {
  const f = fixture({
    disabled: true,
    emailVerified: false,
    customClaims: { teacher: true, admin: true },
  });
  await setAdminPermission(f.auth, ['--email', 'owner@example.test', 'revoke']);
  assert.deepEqual(f.calls.slice(1), [
    ['claims', 'primary-admin', { teacher: true, admin: false }],
    ['revoke', 'primary-admin'],
  ]);
});

test('admin command rejects ambiguous, malformed or missing arguments', () => {
  for (const args of [
    [],
    ['uid'],
    ['uid', 'grant', 'extra'],
    ['--email', 'invalid', 'grant'],
    ['uid', 'owner'],
    ['--unknown', 'grant'],
  ])
    assert.throws(() => parseAdminArguments(args));
});
