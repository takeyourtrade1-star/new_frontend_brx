/**
 * useOnnxLoader — IndexedDB-backed ONNX model cache for the browser.
 *
 * Flow:
 *   1. Check IndexedDB for a cached copy of the model bytes.
 *   2. Cache hit  → return ArrayBuffer from IDB (< 100 ms).
 *   3. Cache miss → fetch from URL list (fallbacks), store in IDB, return ArrayBuffer.
 *
 * Fallback URLs (in order) are built by `buildOnnxModelUrls()` in useBrxScanner.
 * Primary: `${apiBase}/static/dinov2_small.onnx` (requires backend V3 deploy).
 * S3 direct may work only if bucket CORS allows the site origin.
 *
 * Uses only the raw IDB API — no external libraries required.
 *
 * IDB store: "brx-onnx-cache" / key "dinov2_small_v2"
 * Bump MODEL_KEY to force a re-download after a model update.
 */

const IDB_DB_NAME = 'brx-onnx-cache';
const IDB_STORE_NAME = 'models';
const MODEL_KEY = 'dinov2_small_v2'; // bump to invalidate cached model

/** Typical dinov2_small.onnx size when Content-Length is missing (proxy/CDN). */
export const ESTIMATED_ONNX_BYTES = 25_000_000;

// ---------------------------------------------------------------------------
// Progress type
// ---------------------------------------------------------------------------

export type OnnxLoadProgress = {
  loaded: number;
  total: number;
  /** 0–100 when known or estimated; -1 = indeterminate (no bytes yet) */
  percent: number;
  phase: 'idle' | 'downloading' | 'caching' | 'initializing' | 'ready' | 'failed';
  /** Human-readable detail for UI / console (last error, retry hint, etc.) */
  reason?: string;
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

function computeDownloadPercent(loaded: number, contentLength: number): number {
  if (contentLength > 0) {
    return Math.min(100, Math.round((loaded / contentLength) * 100));
  }
  if (loaded <= 0) return -1;
  return Math.min(99, Math.round((loaded / ESTIMATED_ONNX_BYTES) * 100));
}

function displayTotal(contentLength: number, loaded: number): number {
  if (contentLength > 0) return contentLength;
  if (loaded > 0) return ESTIMATED_ONNX_BYTES;
  return 0;
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
    const percent = computeDownloadPercent(loaded, contentLength);
    onProgress?.({
      loaded,
      total: displayTotal(contentLength, loaded),
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

async function fetchOnnxFromUrl(
  url: string,
  onProgress?: (progress: OnnxLoadProgress) => void,
): Promise<ArrayBuffer> {
  const emit = (progress: OnnxLoadProgress) => onProgress?.(progress);

  emit({ loaded: 0, total: 0, percent: -1, phase: 'downloading', reason: url });

  let resp: Response;
  try {
    resp = await fetch(url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[useOnnxLoader] fetch network error:', url, msg);
    emit({
      loaded: 0,
      total: 0,
      percent: 0,
      phase: 'failed',
      reason: `Rete: ${msg}`,
    });
    throw new Error(`Network error fetching ONNX from ${url}: ${msg}`);
  }

  if (!resp.ok) {
    const reason = `HTTP ${resp.status} da ${url}`;
    console.error('[useOnnxLoader]', reason);
    emit({ loaded: 0, total: 0, percent: 0, phase: 'failed', reason });
    throw new Error(`Failed to fetch ONNX model: ${reason}`);
  }

  const data = await readResponseWithProgress(resp, onProgress);

  if (data.byteLength < 100_000) {
    const reason = `File troppo piccolo (${data.byteLength} B) — probabile errore HTML/JSON`;
    emit({
      loaded: data.byteLength,
      total: data.byteLength,
      percent: 0,
      phase: 'failed',
      reason,
    });
    throw new Error(reason);
  }

  return data;
}

// ---------------------------------------------------------------------------
// Main export: fetch + cache (with URL fallbacks)
// ---------------------------------------------------------------------------

/**
 * Load ONNX model, using IndexedDB as a persistent cache.
 *
 * - First call: tries each URL in order, stores in IDB, returns ArrayBuffer.
 * - Subsequent calls: loads from IDB in < 100 ms, returns ArrayBuffer.
 *
 * Throws if both IDB and all network URLs fail.
 */
export async function fetchAndCacheOnnxModel(
  urls: string | string[],
  onProgress?: (progress: OnnxLoadProgress) => void,
): Promise<ArrayBuffer> {
  const urlList = (Array.isArray(urls) ? urls : [urls]).filter(Boolean);
  const emit = (progress: OnnxLoadProgress) => onProgress?.(progress);

  if (urlList.length === 0) {
    const reason = 'Nessun URL modello ONNX configurato';
    emit({ loaded: 0, total: 0, percent: 0, phase: 'failed', reason });
    throw new Error(reason);
  }

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

  // 2. Network — try each URL until one succeeds
  let lastError: Error | null = null;

  for (let i = 0; i < urlList.length; i++) {
    const url = urlList[i];
    const isLast = i === urlList.length - 1;

    try {
      if (i > 0) {
        console.warn('[useOnnxLoader] Trying fallback URL:', url);
        emit({
          loaded: 0,
          total: 0,
          percent: -1,
          phase: 'downloading',
          reason: `Nuovo tentativo (${i + 1}/${urlList.length})…`,
        });
      }

      const data = await fetchOnnxFromUrl(url, onProgress);

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
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (!isLast) continue;
    }
  }

  const reason =
    lastError?.message ??
    'Download modello fallito — verificare deploy backend V3 o CORS S3';
  console.error('[useOnnxLoader] All URLs failed:', urlList, reason);
  emit({ loaded: 0, total: 0, percent: 0, phase: 'failed', reason });
  throw lastError ?? new Error(reason);
}
