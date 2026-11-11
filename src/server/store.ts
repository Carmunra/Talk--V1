import {
  FieldPath,
  type Firestore,
  type Transaction as FirebaseTransaction,
} from 'firebase-admin/firestore';

export type Row = Record<string, any> & { id: string };
export interface UnitOfWork {
  get<T extends Row = Row>(collection: string, id: string): Promise<T | null>;
  find<T extends Row = Row>(collection: string, field: string, value: unknown): Promise<T[]>;
  set(collection: string, row: Row): void;
  remove(collection: string, id: string): void;
}
export interface Store {
  transaction<T>(work: (unit: UnitOfWork) => Promise<T>): Promise<T>;
  get<T extends Row = Row>(collection: string, id: string): Promise<T | null>;
  find<T extends Row = Row>(collection: string, field: string, value: unknown): Promise<T[]>;
  findPage<T extends Row = Row>(
    collection: string,
    field: string,
    value: unknown,
    after?: string,
    limit?: number,
  ): Promise<T[]>;
}

// Mutations are staged so every Firestore transaction performs reads before writes.
// There is deliberately no fallback to memory if the database is unavailable.
export class FirestoreStore implements Store {
  constructor(private readonly db: Firestore) {}
  async get<T extends Row>(collection: string, id: string): Promise<T | null> {
    const snap = await this.db.collection(collection).doc(id).get();
    return snap.exists ? ({ ...snap.data(), id: snap.id } as T) : null;
  }
  async find<T extends Row>(collection: string, field: string, value: unknown): Promise<T[]> {
    const snap = await this.db.collection(collection).where(field, '==', value).get();
    return snap.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as T);
  }
  async findPage<T extends Row>(
    collection: string,
    field: string,
    value: unknown,
    after?: string,
    limit = 100,
  ): Promise<T[]> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('Page limit invalid');
    let query = this.db
      .collection(collection)
      .where(field, '==', value)
      .orderBy(FieldPath.documentId())
      .limit(limit);
    if (after) query = query.startAfter(after);
    const snap = await query.get();
    return snap.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as T);
  }
  transaction<T>(work: (unit: UnitOfWork) => Promise<T>): Promise<T> {
    return this.db.runTransaction(async (tx: FirebaseTransaction) => {
      const writes: (() => void)[] = [];
      const result = await work({
        get: async <R extends Row>(collection: string, id: string) => {
          const snap = await tx.get(this.db.collection(collection).doc(id));
          return snap.exists ? ({ ...snap.data(), id: snap.id } as R) : null;
        },
        find: async <R extends Row>(collection: string, field: string, value: unknown) => {
          const snap = await tx.get(this.db.collection(collection).where(field, '==', value));
          return snap.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as R);
        },
        set: (collection, row) =>
          writes.push(() => tx.set(this.db.collection(collection).doc(row.id), row)),
        remove: (collection, id) =>
          writes.push(() => tx.delete(this.db.collection(collection).doc(id))),
      });
      writes.forEach((write) => write());
      return result;
    });
  }
}
