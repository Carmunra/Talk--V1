import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readConfig } from '../src/server/config';
import { FirestoreStore, type Row } from '../src/server/store';
import { MercadoPagoGateway } from '../src/server/marketplace';
import { Platform } from '../src/server/platform';
import { VideoService } from '../src/server/video';
import { runMaintenance } from '../src/server/maintenance';
import { requireCondition } from '../src/server/security';

try {
  const config = readConfig();
  requireCondition(config.projectId, 503, 'FIREBASE_PROJECT_ID obrigatório');
  const firebase = initializeApp({ projectId: config.projectId, credential: applicationDefault() });
  const store = new FirestoreStore(getFirestore(firebase, config.databaseId));
  const platform = new Platform(store, config, new MercadoPagoGateway(store, config));
  const video = new VideoService(store, config);
  const orderId = process.argv[2];
  if (orderId && !/^[a-zA-Z0-9_-]{1,256}$/.test(orderId)) throw new Error('Identificador inválido');
  async function* pages(): AsyncIterable<Row[]> {
    // The collection query is paginated; pending PIX and refund states also need polling.
    const db = getFirestore(firebase, config.databaseId);
    let cursor: FirebaseFirestore.QueryDocumentSnapshot | undefined;
    for (;;) {
      let query = db.collection('orders').orderBy('__name__').limit(100);
      if (cursor) query = query.startAfter(cursor);
      const page = await query.get();
      if (page.empty) return;
      yield page.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      cursor = page.docs.at(-1);
    }
  }
  const result = await runMaintenance(
    {
      store,
      pages,
      reconcile: (id) => platform.reconcileOrder(id),
      closeRoom: (id) => {
        requireCondition(config.dailyKey, 503, 'Encerramento exige credencial Daily');
        return video.close(id);
      },
    },
    orderId,
  );
  if (result.status === 'FAILED') process.exitCode = 1;
} catch {
  console.error(JSON.stringify({ severity: 'ERROR', event: 'maintenance_failed' }));
  process.exitCode = 1;
}
