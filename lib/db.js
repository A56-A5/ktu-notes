// Local-first storage: IndexedDB database "ktu-notes".
// Stores:
//   kv      — the node tree and settings (one record each)
//   assets  — image/attachment blobs keyed by asset id, tagged with noteId
// Cloud mirroring (when signed in) is plugged in through `hooks`.
export const hooks = { put: null, get: null, del: null, err: () => {} };

const DB_NAME = 'ktu-notes';
const DB_VERSION = 2;

function open() {
  return new Promise((res, rej) => {
    if (typeof indexedDB === 'undefined') return rej(new Error('IndexedDB is not available in this browser'));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      if (!db.objectStoreNames.contains('assets')) {
        const s = db.createObjectStore('assets');
        s.createIndex('noteId', 'noteId');
      }
    };
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

async function tx(store, mode, fn) {
  const db = await open();
  return new Promise((res, rej) => {
    const t = db.transaction(store, mode);
    const rq = fn(t.objectStore(store));
    t.oncomplete = () => res(rq && rq.result);
    t.onerror = () => rej(t.error || new Error('IndexedDB transaction failed'));
    t.onabort = () => rej(t.error || new Error('IndexedDB transaction aborted'));
  });
}

export const kvGet = (k) => tx('kv', 'readonly', (s) => s.get(k));
export const kvSet = (k, v) => tx('kv', 'readwrite', (s) => s.put(v, k));
export const kvDel = (k) => tx('kv', 'readwrite', (s) => s.delete(k));

const lGet = (id) => tx('assets', 'readonly', (s) => s.get(id));
const lPut = (id, blob, meta) => tx('assets', 'readwrite', (s) => s.put({ blob, ...meta }, id));

export async function putAsset(id, blob, meta) {
  await lPut(id, blob, meta);
  if (hooks.put) hooks.put(id, blob, meta).catch(hooks.err);
}

export async function getAsset(id) {
  let a = await lGet(id);
  if (!a && hooks.get) {
    try {
      a = await hooks.get(id);
      if (a) await lPut(id, a.blob, { noteId: a.noteId, name: a.name, type: a.type });
    } catch (e) {
      hooks.err(e);
    }
  }
  return a;
}

export const listAssets = async () => {
  const keys = await tx('assets', 'readonly', (s) => s.getAllKeys());
  const vals = await tx('assets', 'readonly', (s) => s.getAll());
  return keys.map((id, i) => ({ id, ...vals[i] }));
};

export const assetsFor = async (noteId) => {
  const db = await open();
  return new Promise((res, rej) => {
    const t = db.transaction('assets', 'readonly');
    const idx = t.objectStore('assets').index('noteId');
    const rq = idx.getAll(noteId);
    t.oncomplete = () => res(rq.result || []);
    t.onerror = () => rej(t.error);
  });
};

export const delAssetsFor = async (noteIds) => {
  const ids = new Set(Array.isArray(noteIds) ? noteIds : [noteIds]);
  const keys = await tx('assets', 'readonly', (s) => s.getAllKeys());
  const vals = await tx('assets', 'readonly', (s) => s.getAll());
  const doomed = keys.filter((_id, i) => ids.has(vals[i]?.noteId));
  for (const id of doomed) await tx('assets', 'readwrite', (s) => s.delete(id));
  if (hooks.del) hooks.del([...ids]).catch(hooks.err);
};

export const clearAll = async () => {
  await tx('kv', 'readwrite', (s) => s.clear());
  await tx('assets', 'readwrite', (s) => s.clear());
};

export const localUsage = async () => {
  const assets = await listAssets();
  const bytes = assets.reduce((n, a) => n + (a.blob?.size || 0), 0);
  return { assets: assets.length, bytes };
};