import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import type { Request, Response } from 'express';
import { createApp } from '../server/app';
import { readConfig } from '../server/config';
import { FirestoreStore } from '../server/store';
import { Platform } from '../server/platform';
import { MercadoPagoGateway } from '../server/marketplace';
import { AsaasGateway } from '../server/asaas';
import { MonthlySubscriptions } from '../server/subscriptions';

function createBackend() {
  const config = readConfig();
  const rawCredential = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!rawCredential) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON não configurada');
  const serviceAccount = JSON.parse(rawCredential);
  if (serviceAccount.project_id !== config.projectId)
    throw new Error('Credencial Firebase não pertence ao projeto configurado');

  const firebase = initializeApp({
    credential: cert(serviceAccount),
    projectId: config.projectId,
  });
  const auth = getAuth(firebase);
  const store = new FirestoreStore(getFirestore(firebase, config.databaseId));
  const platform = new Platform(store, config, new MercadoPagoGateway(store, config));
  return createApp({
    platform,
    ...(config.asaasSandboxEnabled || config.subscriptionsEnabled
      ? {
          subscriptions: new MonthlySubscriptions(
            platform,
            new AsaasGateway(config.asaasApiKey, true, fetch, config.asaasEnvironment),
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
}

let backend: ReturnType<typeof createBackend> | undefined;

export default function handler(req: Request, res: Response) {
  const url = new URL(req.url || '/', 'https://vercel.local');
  const path = url.searchParams.get('__path');
  if (path !== null) {
    url.searchParams.delete('__path');
    req.url = `/api/${path}${url.search}`;
  }
  try {
    backend ??= createBackend();
    return backend(req, res);
  } catch (error) {
    console.error('backend_initialization_failed', error);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ error: 'Serviço temporariamente indisponível' }));
  }
}

