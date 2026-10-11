import { randomUUID } from 'node:crypto';
import type { Row, Store } from './store';

export interface MaintenanceDependencies {
  store: Store;
  pages: () => AsyncIterable<Row[]>;
  reconcile: (id: string) => Promise<unknown>;
  closeRoom: (lessonId: string) => Promise<unknown>;
  now?: () => number;
  log?: (event: Record<string, unknown>) => void;
  reconcileSubscriptions?: () => Promise<{ failures: number }>;
}

// The lease prevents overlapping scheduler executions. Each provider operation
// renews it; only its owner may release it or publish the final status.
export async function runMaintenance(deps: MaintenanceDependencies, orderId?: string) {
  const { store } = deps;
  const now = deps.now || Date.now;
  const log = deps.log || ((event) => console.log(JSON.stringify(event)));
  const owner = randomUUID();
  const leaseMs = 30 * 60_000;
  const summary = {
    id: 'maintenance',
    owner,
    status: 'RUNNING',
    startedAt: new Date(now()).toISOString(),
    finishedAt: '',
    ordersChecked: 0,
    ordersReconciled: 0,
    roomsClosed: 0,
    failures: 0,
  };
  const acquired = await store.transaction(async (tx) => {
    const lock = await tx.get('maintenance_locks', 'reconciliation');
    if (lock && lock.expiresAt > now()) return false;
    tx.set('maintenance_locks', { id: 'reconciliation', owner, expiresAt: now() + leaseMs });
    tx.set('system', summary);
    return true;
  });
  if (!acquired) {
    log({ event: 'maintenance_skipped', reason: 'lease_active' });
    return { ...summary, status: 'SKIPPED' };
  }
  const renew = () =>
    store.transaction(async (tx) => {
      const lock = await tx.get('maintenance_locks', 'reconciliation');
      if (!lock || lock.owner !== owner || lock.expiresAt <= now()) throw new Error('Lease lost');
      tx.set('maintenance_locks', { ...lock, expiresAt: now() + leaseMs });
    });
  const failure = (event: string, targetId?: string) => {
    summary.failures++;
    // Never put provider credentials, names, emails or request bodies in logs.
    log({ severity: 'ERROR', event, ...(targetId ? { targetId } : {}) });
  };
  try {
    if (deps.reconcileSubscriptions) {
      await renew();
      try {
        const result = await deps.reconcileSubscriptions();
        if (result.failures) failure('subscription_reconciliation_failed');
      } catch {
        failure('subscription_reconciliation_failed');
      }
    }
    const closures = await store.find('room_closures', 'status', 'PENDING');
    for (const room of closures) {
      await renew();
      try {
        await deps.closeRoom(room.lessonId);
        summary.roomsClosed++;
      } catch {
        failure('room_closure_failed', room.id);
      }
    }
    const processOrder = async (id: string) => {
      await renew();
      summary.ordersChecked++;
      try {
        await deps.reconcile(id);
        summary.ordersReconciled++;
      } catch {
        failure('reconciliation_failed', id);
      }
    };
    if (orderId) await processOrder(orderId);
    else
      for await (const page of deps.pages()) {
        for (const order of page) {
          const age = now() - Date.parse(order.createdAt);
          const recent = [
            'PENDING',
            'PAID',
            'REFUND_PENDING',
            'PARTIAL_REFUND_REVIEW',
            'CANCELLED',
          ].includes(order.status);
          if (
            (recent && Number.isFinite(age) && age >= 0 && age <= 180 * 86400_000) ||
            order.status === 'DISPUTED'
          )
            await processOrder(order.id);
        }
      }
  } catch {
    failure('maintenance_failed');
  } finally {
    summary.status = summary.failures ? 'FAILED' : 'SUCCEEDED';
    summary.finishedAt = new Date(now()).toISOString();
    try {
      await store.transaction(async (tx) => {
        const lock = await tx.get('maintenance_locks', 'reconciliation');
        if (!lock || lock.owner !== owner) return;
        tx.set('system', summary);
        tx.remove('maintenance_locks', 'reconciliation');
      });
    } catch {
      failure('maintenance_failed');
      summary.status = 'FAILED';
    }
    log({ event: 'maintenance_completed', ...summary });
  }
  return summary;
}
