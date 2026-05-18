/**
 * IndexedDB cache for DINOv2-small ONNX (~85 MB).
 * One-time download per device; survives tab close (unlike sessionStorage).
 *
 * Enable with NEXT_PUBLIC_BRX_EDGE_EMBED=true once POST /brx-match/search exists.
 */

const DB_NAME = 'brx-scanner-v1';
const STORE = 'models';
const MODEL_KEY = 'dinov2_small';

const DEFAULT_MODEL_URL =
  process.env.NEXT_PUBLIC_BRX_ONNX_URL ??
  'https://ebartex-brx-match-data.s3.eu-south-1.amazonaws.com/dinov2_small.onnx';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
  });
}

async function getBlob(key: string): Promise<Blob | null> {
  if (typeof indexedDB === 'undefined') return null;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve((req.result as Blob) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function putBlob(key: string, blob: Blob): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Returns an object URL for the ONNX model (cached or freshly downloaded).
 * Caller should revoke the URL when the session ends if memory is tight.
 */
export async function getCachedModelUrl(
  remoteUrl: string = DEFAULT_MODEL_URL,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const cached = await getBlob(MODEL_KEY);
  if (cached && cached.size > 1_000_000) {
    return URL.createObjectURL(cached);
  }

  const resp = await fetch(remoteUrl);
  if (!resp.ok) throw new Error(`Model download failed: ${resp.status}`);

  const len = Number(resp.headers.get('content-length') ?? 0);
  const reader = resp.body?.getReader();
  if (!reader) {
    const blob = await resp.blob();
    await putBlob(MODEL_KEY, blob);
    return URL.createObjectURL(blob);
  }

  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.length;
      if (len > 0 && onProgress) onProgress(Math.min(100, Math.round((received / len) * 100)));
    }
  }

  const blob = new Blob(chunks as BlobPart[], { type: 'application/octet-stream' });
  await putBlob(MODEL_KEY, blob);
  if (onProgress) onProgress(100);
  return URL.createObjectURL(blob);
}

export function isEdgeEmbedEnabled(): boolean {
  return process.env.NEXT_PUBLIC_BRX_EDGE_EMBED === 'true';
}
