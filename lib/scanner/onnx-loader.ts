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
 * IDB store: "brx-onnx-cache" / digest+size versioned key. Legacy keys are
 * deleted and every cache hit is re-hashed before inference.
 */

const IDB_DB_NAME = 'brx-onnx-cache';
const IDB_STORE_NAME = 'models';
const LEGACY_MODEL_KEY = 'dinov2_small_v2';
export const MAX_ONNX_MODEL_BYTES = 128 * 1024 * 1024;

/** Typical dinov2_small.onnx size when Content-Length is missing (proxy/CDN). */
export const ESTIMATED_ONNX_BYTES = 25_000_000;

export interface OnnxModelIntegrity {
  bytes: number;
  sha256: string;
}

function validateIntegrity(value: OnnxModelIntegrity): OnnxModelIntegrity {
  if (
    !Number.isSafeInteger(value.bytes) ||
    value.bytes < 100_000 ||
    value.bytes > MAX_ONNX_MODEL_BYTES ||
    !/^[0-9a-f]{64}$/i.test(value.sha256)
  ) {
    throw new Error('Manifest integrità modello non valido');
  }
  return { bytes: value.bytes, sha256: value.sha256.toLowerCase() };
}

function modelCacheKey(integrity: OnnxModelIntegrity): string {
  return `dinov2_small_v2:${integrity.bytes}:${integrity.sha256}`;
}

async function sha256Hex(data: ArrayBuffer): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error('Verifica SHA-256 non disponibile');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function matchesIntegrity(
  data: ArrayBuffer,
  integrity: OnnxModelIntegrity,
): Promise<boolean> {
  return data.byteLength === integrity.bytes && (await sha256Hex(data)) === integrity.sha256;
}

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
export async function loadModelFromIDB(
  rawIntegrity: OnnxModelIntegrity,
): Promise<ArrayBuffer | null> {
  const integrity = validateIntegrity(rawIntegrity);
  const key = modelCacheKey(integrity);
  try {
    const db = await openIdb();
    const result = await new Promise<ArrayBuffer | null>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        db.close();
        const result = req.result;
        if (result instanceof ArrayBuffer) {
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
    if (result && (await matchesIntegrity(result, integrity))) return result;
    return null;
  } catch {
    return null;
  }
}

/**
 * Persist ONNX model bytes to IndexedDB.
 * Silently swallows any storage errors (quota exceeded, private browsing, etc.).
 */
export async function storeModelToIDB(
  data: ArrayBuffer,
  rawIntegrity: OnnxModelIntegrity,
): Promise<void> {
  const integrity = validateIntegrity(rawIntegrity);
  if (!(await matchesIntegrity(data, integrity))) {
    throw new Error('Integrità modello non valida');
  }
  const key = modelCacheKey(integrity);
  try {
    const db = await openIdb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      store.put(data, key);
      store.delete(LEGACY_MODEL_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    console.warn('[useOnnxLoader] IDB store failed');
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
  integrity: OnnxModelIntegrity,
  onProgress?: (progress: OnnxLoadProgress) => void,
): Promise<ArrayBuffer> {
  const rawContentLength = response.headers.get('content-length');
  if (rawContentLength && !/^\d+$/.test(rawContentLength)) {
    throw new Error('Content-Length modello non valido');
  }
  const contentLength = rawContentLength ? Number(rawContentLength) : 0;
  const contentEncoding = response.headers.get('content-encoding')?.trim().toLowerCase();
  if (contentEncoding && contentEncoding !== 'identity') {
    throw new Error('Risposta modello compressa non consentita');
  }
  if (contentLength > MAX_ONNX_MODEL_BYTES || (contentLength && contentLength !== integrity.bytes)) {
    throw new Error('Dimensione modello diversa dal manifest');
  }
  const body = response.body;

  if (!body) {
    throw new Error('Stream modello non disponibile');
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
    loaded += value.byteLength;
    if (loaded > integrity.bytes || loaded > MAX_ONNX_MODEL_BYTES) {
      await reader.cancel();
      throw new Error('Dimensione modello oltre il limite');
    }
    chunks.push(value);
    emitDownload();
  }

  if (loaded !== integrity.bytes) {
    throw new Error('Dimensione modello diversa dal manifest');
  }
  return concatChunks(chunks, loaded);
}

function shortFetchLabel(url: string): string {
  try {
    const u = new URL(url, typeof window !== 'undefined' ? window.location.origin : undefined);
    return `${u.hostname}${u.pathname}`;
  } catch {
    return 'origine sconosciuta';
  }
}

async function fetchOnnxFromUrl(
  url: string,
  integrity: OnnxModelIntegrity,
  onProgress?: (progress: OnnxLoadProgress) => void,
): Promise<ArrayBuffer> {
  const emit = (progress: OnnxLoadProgress) => onProgress?.(progress);
  const label = shortFetchLabel(url);

  emit({ loaded: 0, total: 0, percent: -1, phase: 'downloading', reason: label });

  let resp: Response;
  try {
    const resolved = new URL(url, window.location.origin);
    if (resolved.origin !== window.location.origin) {
      throw new Error('cross-origin model URL rejected');
    }
    resp = await fetch(resolved.href, {
      headers: { 'X-Scanner-Request': '1' },
      mode: 'same-origin',
      credentials: 'same-origin',
      cache: 'no-store',
      redirect: 'error',
    });
  } catch {
    console.error('[useOnnxLoader] fetch network error:', label);
    emit({
      loaded: 0,
      total: 0,
      percent: 0,
      phase: 'failed',
      reason: 'Rete non disponibile',
    });
    throw new Error('Download modello non disponibile');
  }

  if (!resp.ok) {
    const reason = `HTTP ${resp.status} da ${label}`;
    console.error('[useOnnxLoader]', reason);
    emit({ loaded: 0, total: 0, percent: 0, phase: 'failed', reason });
    throw new Error(`Failed to fetch ONNX model: ${reason}`);
  }

  const data = await readResponseWithProgress(resp, integrity, onProgress);
  if (!(await matchesIntegrity(data, integrity))) {
    emit({ loaded: 0, total: integrity.bytes, percent: 0, phase: 'failed', reason: 'SHA-256 non valido' });
    throw new Error('Integrità SHA-256 del modello non valida');
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
  rawIntegrity: OnnxModelIntegrity,
  onProgress?: (progress: OnnxLoadProgress) => void,
): Promise<ArrayBuffer> {
  const integrity = validateIntegrity(rawIntegrity);
  const urlList = (Array.isArray(urls) ? urls : [urls]).filter(Boolean);
  const emit = (progress: OnnxLoadProgress) => onProgress?.(progress);

  if (urlList.length === 0) {
    const reason = 'Nessun URL modello ONNX configurato';
    emit({ loaded: 0, total: 0, percent: 0, phase: 'failed', reason });
    throw new Error(reason);
  }

  // 1. IDB fast path
  const cached = await loadModelFromIDB(integrity);
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

      const data = await fetchOnnxFromUrl(url, integrity, onProgress);

      emit({
        loaded: data.byteLength,
        total: data.byteLength,
        percent: 100,
        phase: 'caching',
      });
      await storeModelToIDB(data, integrity);

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
  console.error('[useOnnxLoader] All same-origin model URLs failed');
  emit({ loaded: 0, total: 0, percent: 0, phase: 'failed', reason });
  throw lastError ?? new Error(reason);
}
