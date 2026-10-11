import express from 'express';
import path from 'node:path';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createApp } from './src/server/app';
import { readConfig } from './src/server/config';
import { FirestoreStore } from './src/server/store';
import { Platform } from './src/server/platform';
import { MercadoPagoGateway } from './src/server/marketplace';
import { AsaasSandboxGateway } from './src/server/asaas';
import { MonthlySubscriptions } from './src/server/subscriptions';

const config = readConfig();
if (!config.projectId) throw new Error('Configure FIREBASE_PROJECT_ID antes de iniciar');
const firebase = initializeApp({ credential: applicationDefault(), projectId: config.projectId });
const auth = getAuth(firebase);
const store = new FirestoreStore(getFirestore(firebase, config.databaseId));
const platform = new Platform(store, config, new MercadoPagoGateway(store, config));
const app = createApp({
  platform,
  ...(config.asaasSandboxEnabled
    ? {
        subscriptions: new MonthlySubscriptions(
          platform,
          new AsaasSandboxGateway(config.asaasApiKey, true),
        ),
      }
    : {}),
  verifyToken: async (token) => {
    const decoded = await auth.verifyIdToken(token, true);
    return {
      uid: decoded.uid,
      email: decoded.email || '',
      emailVerified: decoded.email_verified === true,
      admin: decoded.admin === true,
    };
  },
  revokeSessions: async (uid) => {
    await auth.revokeRefreshTokens(uid);
    await auth.updateUser(uid, { disabled: true });
  },
});

if (!config.production) {
  const { createServer } = await import('vite');
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
} else {
  const assets = path.resolve('dist/client');
  app.use(express.static(assets, { dotfiles: 'deny', index: false }));
  app.get('*', (_req, res) => res.sendFile(path.join(assets, 'index.html')));
}
const server = app.listen(Number(process.env.PORT) || 3000, '0.0.0.0', () =>
  console.log('Talkê iniciado'),
);
const shutdown = () => server.close(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
