/**
 * useOnnxLoader — IndexedDB-backed ONNX model cache for the browser.
 *
 * Flow:
 *   1. Check IndexedDB for a cached copy of the model bytes.
 *   2. Cache hit  → return ArrayBuffer from IDB (< 100 ms).
 *   3. Cache miss → fetch from the provided URL, store in IDB, return ArrayBuffer.
 *
 * Uses only the raw IDB API — no external libraries required.
 *
 * IDB store: "brx-onnx-cache" / key "dinov2_small_v2"
 * Bump MODEL_KEY to force a re-download after a model update.
 */

const IDB_DB_NAME = 'brx-onnx-cache';
const IDB_STORE_NAME = 'models';
const MODEL_KEY = 'dinov2_small_v2'; // bump to invalidate cached model

// ---------------------------------------------------------------------------
// Progress type
// ---------------------------------------------------------------------------

export type OnnxLoadProgress = {
  loaded: number;
  total: number;
  /** 0–100 when Content-Length is known; -1 = indeterminate download */
  percent: number;
  phase: 'idle' | 'downloading' | 'caching' | 'ready' | 'failed';
};

export const ONNX_LOAD_PROGRESS_IDLE: OnnxLoadProgress = {
  loaded: 0,
  total: 0,
  percent: 0,
  phase: 'idle',
};

// ---------------------------------------------------------------------------
// Low-level IDB helpers
// ---------------------------------------------------------------------------

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const req = indexedDB.open(IDB_DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME);
      }
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Try to load the cached ONNX model bytes from IndexedDB.
 * Returns null on any error or cache miss.
 */
export async function loadModelFromIDB(): Promise<ArrayBuffer | null> {
  try {
    const db = await openIdb();
    return await new Promise<ArrayBuffer | null>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.get(MODEL_KEY);
      req.onsuccess = () => {
        db.close();
        const result = req.result;
        // Validate: must be a non-trivial ArrayBuffer
        if (result instanceof ArrayBuffer && result.byteLength > 100_000) {
          resolve(result);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return null;
  }
}

/**
 * Persist ONNX model bytes to IndexedDB.
 * Silently swallows any storage errors (quota exceeded, private browsing, etc.).
 */
export async function storeModelToIDB(data: ArrayBuffer): Promise<void> {
  try {
    const db = await openIdb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.put(data, MODEL_KEY);
      req.onsuccess = () => {
        db.close();
        resolve();
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch (err) {
    console.warn('[useOnnxLoader] IDB store failed:', err);
  }
}

// ---------------------------------------------------------------------------
// Stream helpers
// ---------------------------------------------------------------------------

function concatChunks(chunks: Uint8Array[], totalLength: number): ArrayBuffer {
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged.buffer;
}

async function readResponseWithProgress(
  response: Response,
  onProgress?: (progress: OnnxLoadProgress) => void,
): Promise<ArrayBuffer> {
  const contentLength = Number(response.headers.get('content-length')) || 0;
  const body = response.body;

  if (!body) {
    const data = await response.arrayBuffer();
    const total = contentLength || data.byteLength;
    onProgress?.({
      loaded: data.byteLength,
      total,
      percent: 100,
      phase: 'downloading',
    });
    return data;
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  const emitDownload = () => {
    const percent =
      contentLength > 0
        ? Math.min(100, Math.round((loaded / contentLength) * 100))
        : -1;
    onProgress?.({
      loaded,
      total: contentLength,
      percent,
      phase: 'downloading',
    });
  };

  emitDownload();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    emitDownload();
  }

  return concatChunks(chunks, loaded);
}

// ---------------------------------------------------------------------------
// Main export: fetch + cache
// ---------------------------------------------------------------------------

/**
 * Load ONNX model, using IndexedDB as a persistent cache.
 *
 * - First call: fetches from `url`, stores in IDB, returns ArrayBuffer.
 * - Subsequent calls: loads from IDB in < 100 ms, returns ArrayBuffer.
 *
 * Throws if both IDB and network fail.
 */
export async function fetchAndCacheOnnxModel(
  url: string,
  onProgress?: (progress: OnnxLoadProgress) => void,
): Promise<ArrayBuffer> {
  const emit = (progress: OnnxLoadProgress) => onProgress?.(progress);

  // 1. IDB fast path
  const cached = await loadModelFromIDB();
  if (cached !== null) {
    emit({
      loaded: cached.byteLength,
      total: cached.byteLength,
      percent: 100,
      phase: 'ready',
    });
    return cached;
  }

  // 2. Network fetch with byte tracking
  emit({ loaded: 0, total: 0, percent: 0, phase: 'downloading' });

  const resp = await fetch(url);
  if (!resp.ok) {
    emit({ loaded: 0, total: 0, percent: 0, phase: 'failed' });
    throw new Error(`Failed to fetch ONNX model from ${url}: HTTP ${resp.status}`);
  }

  const data = await readResponseWithProgress(resp, onProgress);

  if (data.byteLength < 100_000) {
    emit({ loaded: data.byteLength, total: data.byteLength, percent: 0, phase: 'failed' });
    throw new Error(`ONNX model too small (${data.byteLength} bytes) — likely a network error`);
  }

  // 3. Persist to IDB (await so phase reflects real caching)
  emit({
    loaded: data.byteLength,
    total: data.byteLength,
    percent: 100,
    phase: 'caching',
  });
  await storeModelToIDB(data);

  emit({
    loaded: data.byteLength,
    total: data.byteLength,
    percent: 100,
    phase: 'ready',
  });

  return data;
}
