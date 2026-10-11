import express from 'express';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { createServer } from 'vite';
import { createApp } from '../../src/server/app';
import { fixture } from './fixture';
import { subscriptionFixture, FakeSubscriptions, account } from './subscription-fixture';
import { MonthlySubscriptions } from '../../src/server/subscriptions';

if (
  process.env.NODE_ENV === 'production' ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9099'
)
  throw new Error('Test server requires the local Auth emulator and cannot run in production');
const firebase = initializeApp({ projectId: 'demo-talke' }),
  auth = getAuth(firebase);
for (const uid of ['student', 'teacher', 'other', 'guardian', 'admin', 'newadult']) {
  try {
    await auth.deleteUser(uid);
  } catch {}
  await auth.createUser({
    uid,
    email: uid + '@example.test',
    password: 'Local-test-password-123!',
    emailVerified: true,
  });
  if (uid === 'admin') await auth.setCustomUserClaims(uid, { admin: true });
}
const state = await fixture();
Object.assign(state.config, {
  asaasSandboxEnabled: true,
  asaasApiKey: 'sandbox-test-key',
  asaasWebhookToken: 's'.repeat(40),
  asaasAccountId: account,
});
const subscriptionGateway = new FakeSubscriptions();
const subscriptions = new MonthlySubscriptions(state.platform, subscriptionGateway);
state.config.origin = 'http://127.0.0.1:3000';
const host = express();
// Test helpers exist only in this separately launched test executable.
host.post('/_test/reset', async (req, res) => {
  if (req.header('x-test-key') !== 'local-e2e') return res.sendStatus(403);
  const fresh = await fixture();
  state.advance(Date.now() - state.platform.now());
  Object.assign(subscriptionGateway, new FakeSubscriptions());
  state.store.replaceForTest(fresh.store);
  state.gateway.payments.clear();
  state.gateway.refunds = [];
  state.gateway.checkoutCalls = 0;
  res.json({ reset: true, date: state.booking.scheduledDate });
});
host.post('/_test/subscriptions/seed', async (req, res) => {
  if (req.header('x-test-key') !== 'local-e2e') return res.sendStatus(403);
  const fresh = await subscriptionFixture();
  state.store.replaceForTest(fresh.store);
  Object.assign(subscriptionGateway, fresh.gateway);
  res.json({ booking: fresh.booking, subscriptionId: 'sub_student' });
});
host.post('/_test/subscriptions/finish/:id', async (req, res) => {
  if (req.header('x-test-key') !== 'local-e2e') return res.sendStatus(403);
  const lesson = await state.store.get('lessons', req.params.id);
  if (!lesson) return res.sendStatus(404);
  state.advance(lesson.scheduledAt + lesson.durationMinutes * 60_000 - state.platform.now());
  res.json({ advanced: true });
});
host.get('/_test/subscriptions/status', (req, res) => {
  if (req.header('x-test-key') !== 'local-e2e') return res.sendStatus(403);
  res.json({
    calls: subscriptionGateway.sendCalls,
    transfers: [...subscriptionGateway.transfers.values()],
  });
});
host.post('/_test/approve/:orderId', async (req, res) => {
  if (req.header('x-test-key') !== 'local-e2e') return res.sendStatus(403);
  const order = await state.store.get('orders', req.params.orderId);
  if (!order) return res.sendStatus(404);
  state.gateway.approve(order);
  await state.platform.reconcilePayment('123', '99');
  res.json({ approved: true });
});
host.use(
  createApp({
    platform: state.platform,
    subscriptions,
    verifyToken: async (token) => {
      const decoded = await auth.verifyIdToken(token, true);
      return {
        uid: decoded.uid,
        email: decoded.email || '',
        emailVerified: decoded.email_verified === true,
        admin: decoded.admin === true,
      };
    },
  }),
);
const vite = await createServer({ mode: 'test', server: { middlewareMode: true }, appType: 'spa' });
host.use(vite.middlewares);
const server = host.listen(3000, '127.0.0.1');
process.on('SIGTERM', () => server.close(() => process.exit(0)));
