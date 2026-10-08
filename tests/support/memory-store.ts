import type { Store, Row, UnitOfWork } from '../../src/server/store';
// Test adapter only. Not imported by the production entry point.
export class MemoryStore implements Store {
  private rows = new Map<string, Row>();
  private tail: Promise<void> = Promise.resolve();
  offline = false;
  replaceForTest(source: MemoryStore) {
    this.rows = new Map([...source.rows].map(([key, row]) => [key, structuredClone(row)]));
  }
  private check() {
    if (this.offline) throw new Error('database offline');
  }
  async get<T extends Row = Row>(collection: string, id: string): Promise<T | null> {
    this.check();
    const row = this.rows.get(collection + '/' + id);
    return row ? (structuredClone(row) as T) : null;
  }
  async find<T extends Row = Row>(collection: string, field: string, value: unknown): Promise<T[]> {
    this.check();
    return [...this.rows.entries()]
      .filter(([key, row]) => key.startsWith(collection + '/') && row[field] === value)
      .map(([, row]) => structuredClone(row) as T);
  }
  async transaction<T>(work: (unit: UnitOfWork) => Promise<T>): Promise<T> {
    let release!: () => void;
    const previous = this.tail;
    this.tail = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      this.check();
      const changes: (() => void)[] = [];
      const result = await work({
        get: this.get.bind(this),
        find: this.find.bind(this),
        set: (collection, row) => {
          const copy = structuredClone(row);
          changes.push(() => this.rows.set(collection + '/' + row.id, copy));
        },
        remove: (collection, id) => changes.push(() => this.rows.delete(collection + '/' + id)),
      });
      this.check();
      changes.forEach((commit) => commit());
      return result;
    } finally {
      release();
    }
  }
}
