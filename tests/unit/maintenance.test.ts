import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryStore } from '../support/memory-store';
import { runMaintenance, type MaintenanceDependencies } from '../../src/server/maintenance';

const now = Date.parse('2026-10-11T12:00:00Z');
function deps(store = new MemoryStore()): MaintenanceDependencies {
  return {
    store,
    now: () => now,
    log: () => {},
    pages: async function* () {
      yield [];
    },
    reconcile: async () => {},
    closeRoom: async () => {},
  };
}
test('closure and order failures are isolated; all remaining work runs and reports failure', async () => {
  const d = deps(),
    seen: string[] = [],
    events: any[] = [];
  await d.store.transaction(async (tx) => {
    tx.set('room_closures', { id: 'bad-room', lessonId: 'bad', status: 'PENDING' });
    tx.set('room_closures', { id: 'good-room', lessonId: 'good', status: 'PENDING' });
  });
  d.pages = async function* () {
    yield ['bad', 'good', 'cancelled'].map((id) => ({
      id,
      status: id === 'cancelled' ? 'CANCELLED' : 'PENDING',
      createdAt: new Date(now).toISOString(),
    }));
  };
  d.closeRoom = async (id) => {
    seen.push('room:' + id);
    if (id === 'bad') throw new Error('sensitive-provider-token');
  };
  d.reconcile = async (id) => {
    seen.push('order:' + id);
    if (id === 'bad') throw new Error('private@example.test');
  };
  d.log = (event) => events.push(event);
  const result = await runMaintenance(d);
  assert.deepEqual(seen, ['room:bad', 'room:good', 'order:bad', 'order:good', 'order:cancelled']);
  assert.equal(result.status, 'FAILED');
  assert.equal(result.failures, 2);
  assert.equal((await d.store.get('system', 'maintenance'))?.ordersReconciled, 2);
  assert.equal(await d.store.get('maintenance_locks', 'reconciliation'), null);
  assert.equal(JSON.stringify(events).includes('sensitive-provider-token'), false);
  assert.equal(JSON.stringify(events).includes('private@example.test'), false);
});
test('active lease blocks overlapping work; expired lease can be recovered', async () => {
  const d = deps();
  let calls = 0;
  await d.store.transaction(async (tx) =>
    tx.set('maintenance_locks', { id: 'reconciliation', owner: 'other', expiresAt: now + 1 }),
  );
  d.reconcile = async () => {
    calls++;
  };
  assert.equal((await runMaintenance(d, 'order')).status, 'SKIPPED');
  assert.equal(calls, 0);
  d.now = () => now + 2;
  assert.equal((await runMaintenance(d, 'order')).status, 'SUCCEEDED');
  assert.equal(calls, 1);
});
test('lost lease never deletes another worker lock or overwrites its report', async () => {
  const d = deps();
  let calls = 0;
  d.pages = async function* () {
    await d.store.transaction(async (tx) => {
      tx.set('maintenance_locks', {
        id: 'reconciliation',
        owner: 'replacement',
        expiresAt: now + 1000,
      });
      tx.set('system', { id: 'maintenance', owner: 'replacement', status: 'RUNNING' });
    });
    yield [{ id: 'order', status: 'PAID', createdAt: new Date(now).toISOString() }];
  };
  d.reconcile = async () => {
    calls++;
  };
  assert.equal((await runMaintenance(d)).status, 'FAILED');
  assert.equal(calls, 0);
  assert.equal((await d.store.get('maintenance_locks', 'reconciliation'))?.owner, 'replacement');
  assert.equal((await d.store.get('system', 'maintenance'))?.owner, 'replacement');
});
test('pagination processes recent orders and old disputes, without polling invalid or aged settled rows', async () => {
  const d = deps(),
    ids: string[] = [];
  d.pages = async function* () {
    yield [
      { id: 'aged', status: 'PAID', createdAt: '2020-01-01' },
      { id: 'invalid', status: 'PENDING', createdAt: 'bad' },
    ];
    yield [
      { id: 'dispute', status: 'DISPUTED', createdAt: '2020-01-01' },
      { id: 'future', status: 'PENDING', createdAt: '2030-01-01' },
    ];
  };
  d.reconcile = async (id) => {
    ids.push(id);
  };
  assert.equal((await runMaintenance(d)).status, 'SUCCEEDED');
  assert.deepEqual(ids, ['dispute']);
});
test('failed report persistence never yields a successful maintenance result', async () => {
  const d = deps();
  d.reconcile = async () => {
    (d.store as MemoryStore).offline = true;
  };
  assert.equal((await runMaintenance(d, 'order')).status, 'FAILED');
});
