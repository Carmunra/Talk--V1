import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readConfig } from '../src/server/config';
import { FirestoreStore } from '../src/server/store';
import { MercadoPagoGateway } from '../src/server/marketplace';
import { Platform } from '../src/server/platform';
import { VideoService } from '../src/server/video';

const config = readConfig();
const firebase = initializeApp({ projectId: config.projectId, credential: applicationDefault() });
const store = new FirestoreStore(getFirestore(firebase, config.databaseId));
const platform = new Platform(store, config, new MercadoPagoGateway(store, config));
await new VideoService(store, config).retryClosures();
const orderId = process.argv[2];
if (orderId) {
  if (!/^[a-zA-Z0-9_-]{1,256}$/.test(orderId)) throw new Error('Identificador inválido');
  await platform.reconcileOrder(orderId);
  console.log(JSON.stringify({ event: 'reconciled', orderId }));
} else {
  // The collection query is paginated; pending PIX and refund states also need polling.
  const db = getFirestore(firebase, config.databaseId);
  let cursor: FirebaseFirestore.QueryDocumentSnapshot | undefined;
  let failed = 0;
  for (;;) {
    let query = db.collection('orders').orderBy('__name__').limit(100);
    if (cursor) query = query.startAfter(cursor);
    const page = await query.get();
    if (page.empty) break;
    for (const doc of page.docs) {
      const order = doc.data();
      const age = Date.now() - Date.parse(order.createdAt);
      if (
        (['PENDING', 'PAID', 'REFUND_PENDING', 'PARTIAL_REFUND_REVIEW'].includes(order.status) &&
          age <= 180 * 86400_000) ||
        order.status === 'DISPUTED'
      ) {
        try {
          await platform.reconcileOrder(doc.id);
        } catch {
          failed++;
          console.error(JSON.stringify({ event: 'reconciliation_failed', orderId: doc.id }));
        }
      }
    }
    cursor = page.docs.at(-1);
  }
  if (failed) process.exitCode = 1;
}
