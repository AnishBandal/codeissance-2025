// Minimal IndexedDB helper tailored for offline lead drafts.
// No external dependency to keep bundle small.

export interface IDBStoreConfig {
  name: string;
  version: number;
  stores: Array<{ name: string; keyPath?: string; indices?: { name: string; keyPath: string; options?: IDBIndexParameters }[] }>; 
}

const dbName = 'boi-offline';
const dbVersion = 1;
const draftStore = 'leadDrafts';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName, dbVersion);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(draftStore)) {
        const store = db.createObjectStore(draftStore, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export interface DraftRecord<T=unknown> {
  id: string;
  createdAt: number;
  payload: T;
  retryCount: number;
  lastError?: string;
}

async function awaitTx(tx: IDBTransaction) {
  return await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function putDraft<T>(record: DraftRecord<T>) {
  const db = await openDB();
  const tx = db.transaction(draftStore, 'readwrite');
  tx.objectStore(draftStore).put(record);
  await awaitTx(tx);
}

export async function getDrafts<T>(): Promise<DraftRecord<T>[]> {
  const db = await openDB();
  const tx = db.transaction(draftStore, 'readonly');
  const store = tx.objectStore(draftStore);
  const index = store.index('createdAt');
  return await new Promise((resolve, reject) => {
    const req = index.getAll();
    req.onsuccess = () => resolve(req.result as DraftRecord<T>[]);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteDraft(id: string) {
  const db = await openDB();
  const tx = db.transaction(draftStore, 'readwrite');
  tx.objectStore(draftStore).delete(id);
  await awaitTx(tx);
}

export async function updateDraft(id: string, partial: Partial<DraftRecord>) {
  const drafts = await getDrafts();
  const target = drafts.find(d => d.id === id);
  if (!target) return;
  const updated = { ...target, ...partial };
  await putDraft(updated);
}

export async function clearDrafts() {
  const db = await openDB();
  const tx = db.transaction(draftStore, 'readwrite');
  tx.objectStore(draftStore).clear();
  await awaitTx(tx);
}

export { draftStore };
