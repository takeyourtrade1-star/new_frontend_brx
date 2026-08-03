import type { ScanSession } from '@/hooks/scanner/scanner-types';

const DB_NAME = 'ebartex-asso-vision';
const STORE_NAME = 'sessions';
const LEGACY_ACTIVE_SESSION_KEY = 'active';
const DB_VERSION = 1;
export const SCAN_SESSION_TTL_MS = 2 * 60 * 60 * 1000;

interface StoredScanSession {
  schemaVersion: 1;
  ownerId: string;
  expiresAt: number;
  session: ScanSession;
}

function normalizedOwnerId(ownerId: string): string {
  const value = ownerId.trim();
  return /^[A-Za-z0-9_-]{1,128}$/.test(value) ? value : '';
}

export function scanSessionStorageKey(ownerId: string): string {
  const owner = normalizedOwnerId(ownerId);
  return owner ? `active:${owner}` : '';
}

export function validOwnedScanSession(
  value: unknown,
  ownerId: string,
  now = Date.now(),
): ScanSession | null {
  if (!value || typeof value !== 'object') return null;
  const stored = value as Partial<StoredScanSession>;
  if (
    stored.schemaVersion !== 1 ||
    stored.ownerId !== normalizedOwnerId(ownerId) ||
    typeof stored.expiresAt !== 'number' ||
    !Number.isFinite(stored.expiresAt) ||
    stored.expiresAt <= now ||
    !stored.session ||
    typeof stored.session !== 'object'
  ) {
    return null;
  }
  return stored.session;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB non disponibile'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadScanSession(ownerId: string): Promise<ScanSession | null> {
  const key = scanSessionStorageKey(ownerId);
  if (!key) return null;
  try {
    const db = await openDatabase();
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      // Unscoped pre-hardening records are deleted, never migrated to a user.
      store.delete(LEGACY_ACTIVE_SESSION_KEY);
      const request = store.get(key);
      request.onsuccess = () => {
        const session = validOwnedScanSession(request.result, ownerId);
        if (!session) store.delete(key);
        transaction.oncomplete = () => {
          db.close();
          resolve(session);
        };
      };
      request.onerror = () => reject(request.error);
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  } catch {
    return null;
  }
}

export async function saveScanSession(ownerId: string, session: ScanSession): Promise<void> {
  const owner = normalizedOwnerId(ownerId);
  const key = scanSessionStorageKey(owner);
  if (!key) return;
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const record: StoredScanSession = {
        schemaVersion: 1,
        ownerId: owner,
        expiresAt: Date.now() + SCAN_SESSION_TTL_MS,
        session,
      };
      const store = transaction.objectStore(STORE_NAME);
      store.delete(LEGACY_ACTIVE_SESSION_KEY);
      store.put(record, key);
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  } catch {
    // A failed private-data persistence must not disclose record contents/log blobs.
    console.warn('[AssoVision] salvataggio sessione locale non riuscito');
  }
}

export async function clearScanSession(ownerId: string): Promise<void> {
  const key = scanSessionStorageKey(ownerId);
  if (!key) return;
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.delete(key);
      store.delete(LEGACY_ACTIVE_SESSION_KEY);
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  } catch {
    // A session that cannot be deleted must not block camera teardown.
  }
}

export async function clearAllScanSessions(): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).clear();
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  } catch {
    // Best-effort purge; owner validation remains fail-closed on future reads.
  }
}
