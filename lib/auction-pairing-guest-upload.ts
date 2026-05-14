/**
 * Guest photo upload for the QR “phone → desktop” flow.
 * Calls the same auction photo init/finalize as the logged-in client but sends
 * pairing_session_id + pairing_upload_token instead of Authorization (no login on mobile).
 *
 * Kept outside `lib/api/` so the main auction-photo client stays auth-only.
 *
 * Speed: the cropped image is usually already WebP from the canvas — we skip the heavy
 * desktop `compressImage` (2048px + web worker) unless the file is still large.
 */

import imageCompression from 'browser-image-compression';
import type { UploadedPhoto } from '@/lib/api/auction-photo-client';

/** Skip re-encoding when under this size (typical after capped canvas crop). */
const GUEST_SKIP_COMPRESS_BYTES = 900 * 1024;

const GUEST_HEAVY_COMPRESSION = {
  maxSizeMB: 0.48,
  maxWidthOrHeight: 1536,
  initialQuality: 0.78,
  fileType: 'image/webp' as const,
  /** Worker spawn is often slower than one main-thread pass on a single phone photo. */
  useWebWorker: false,
};

async function prepareGuestUploadFile(file: File): Promise<File> {
  if (file.size <= GUEST_SKIP_COMPRESS_BYTES && file.type === 'image/webp') {
    return file;
  }
  const out = await imageCompression(file, GUEST_HEAVY_COMPRESSION);
  if (out instanceof File) return out;
  return new File([out], file.name.replace(/\.[a-z0-9]+$/i, '.webp'), {
    type: 'image/webp',
    lastModified: Date.now(),
  });
}

const MAX_INIT_FINALIZE_RETRIES = 3;
const INIT_FINALIZE_BACKOFF_MS = [400, 1200, 3000];

interface PhotoInitResponse {
  upload_url: string;
  method: 'PUT';
  headers: Record<string, string>;
  max_bytes: number;
  photo_token: string;
  s3_key: string;
  expires_in: number;
}

interface PhotoFinalizeResponse {
  id: number;
  cdn_url: string;
  width: number | null;
  height: number | null;
  bytes: number;
  mime: string;
}

export interface PairingGuestUploadOptions {
  pairingSessionId: string;
  pairingUploadToken: string;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

export interface PairingSessionStatus {
  status?: string;
  auction_id?: number | null;
  photos?: unknown[];
}

/**
 * Polls the pairing session status as a guest (no login required).
 * Passes the upload token via a custom header.
 * Returns `{ status: 'COMPLETED' }` when the session is gone (404/410).
 */
export async function pollPairingSessionAsGuest(
  sessionId: string,
  uploadToken: string,
): Promise<PairingSessionStatus> {
  try {
    const data = await guestJsonRequest<{ success?: boolean; data?: PairingSessionStatus }>(
      `/api/auctions/photos/pairing-sessions/${encodeURIComponent(sessionId)}`,
      {
        headers: {
          'X-Pairing-Upload-Token': uploadToken,
        },
      },
    );
    return data.data ?? {};
  } catch (err) {
    const e = err as { status?: number };
    if (e.status === 404 || e.status === 410) {
      return { status: 'COMPLETED' };
    }
    throw err;
  }
}

async function guestJsonRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(init.headers as Record<string, string> | undefined),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const err = new Error(
      msg === 'Load failed' || msg === 'Failed to fetch'
        ? 'Connessione non riuscita. Controlla la rete o riprova tra poco.'
        : msg,
    ) as Error & { status?: number };
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const raw = (data as { detail?: unknown })?.detail;
    let detailStr = '';
    if (typeof raw === 'string') detailStr = raw;
    else if (Array.isArray(raw)) {
      detailStr = raw
        .map((x) => (typeof x === 'object' && x && 'msg' in x ? String((x as { msg: string }).msg) : JSON.stringify(x)))
        .join('; ');
    } else if (raw && typeof raw === 'object') detailStr = JSON.stringify(raw);

    const message =
      detailStr ||
      (data as { error?: string })?.error ||
      (data as { message?: string })?.message ||
      `HTTP ${res.status}`;
    const err = new Error(message) as Error & { status: number; data: unknown };
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data as T;
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_INIT_FINALIZE_RETRIES; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      const e = err as { status?: number };
      if (e?.status && e.status < 500) {
        throw err;
      }
      lastErr = err;
      const delay = INIT_FINALIZE_BACKOFF_MS[attempt] ?? 3000;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

async function sha256Hex(file: Blob): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function putToS3(
  upload: PhotoInitResponse,
  body: Blob,
  options: PairingGuestUploadOptions,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', upload.upload_url, true);
    Object.entries(upload.headers).forEach(([k, v]) => {
      xhr.setRequestHeader(k, v);
    });
    if (options.onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 100);
          options.onProgress?.(pct);
        }
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        const err = new Error(
          `S3 PUT failed: ${xhr.status} ${xhr.statusText || ''}`,
        ) as Error & { status: number };
        err.status = xhr.status;
        reject(err);
      }
    };
    xhr.onerror = () => reject(new Error('Network error during S3 upload'));
    xhr.onabort = () => reject(new Error('Upload aborted'));
    options.signal?.addEventListener('abort', () => xhr.abort(), { once: true });
    xhr.send(body);
  });
}

async function initGuest(args: {
  filename: string;
  content_type: string;
  size: number;
  sha256: string;
  pairing_session_id: string;
  pairing_upload_token: string;
}): Promise<PhotoInitResponse> {
  const res = await withRetry(() =>
    guestJsonRequest<{ success: boolean; data: PhotoInitResponse }>(
      '/api/auctions/photos/init',
      {
        method: 'POST',
        body: JSON.stringify(args),
      },
    ),
  );
  return res.data;
}

async function finalizeGuest(args: {
  photo_token: string;
  s3_key: string;
  pairing_session_id: string;
  pairing_upload_token: string;
}): Promise<PhotoFinalizeResponse> {
  const res = await withRetry(() =>
    guestJsonRequest<{ success: boolean; data: PhotoFinalizeResponse }>(
      '/api/auctions/photos/finalize',
      {
        method: 'POST',
        body: JSON.stringify(args),
      },
    ),
  );
  return res.data;
}

/** Same pipeline as `uploadPhoto` but authenticates with pairing session + secret (QR). */
export async function uploadPhotoAsPairingGuest(
  rawFile: File,
  options: PairingGuestUploadOptions,
): Promise<UploadedPhoto> {
  const report = (p: number) =>
    options.onProgress?.(Math.min(100, Math.max(0, Math.round(p))));

  report(2);
  const compressed = await prepareGuestUploadFile(rawFile);
  options.signal?.throwIfAborted?.();
  report(10);

  const sha256 = await sha256Hex(compressed);
  options.signal?.throwIfAborted?.();
  report(14);

  const sid = options.pairingSessionId;
  const tok = options.pairingUploadToken;

  const initBody = {
    filename: compressed.name || 'photo.webp',
    content_type: compressed.type || 'image/webp',
    size: compressed.size,
    sha256,
    pairing_session_id: sid,
    pairing_upload_token: tok,
  };

  const init = await initGuest(initBody);
  report(18);

  const makePut = (upload: PhotoInitResponse) =>
    putToS3(upload, compressed, {
      ...options,
      onProgress: (pct) => report(18 + Math.round((pct / 100) * 68)),
    });

  /**
   * Retry the PUT on network errors (no HTTP status) up to 2 extra times with 1 s delay.
   * HTTP errors are re-thrown immediately so the outer handler can decide.
   */
  const putWithNetworkRetry = async (upload: PhotoInitResponse): Promise<void> => {
    let lastErr: unknown;
    for (let attempt = 0; attempt <= 2; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 1000));
      try {
        await makePut(upload);
        return;
      } catch (err) {
        lastErr = err;
        const status = (err as { status?: number })?.status;
        if (status) throw err; // HTTP error — escalate immediately
        // network error — loop and retry
      }
    }
    throw lastErr;
  };

  try {
    await putWithNetworkRetry(init);
  } catch (err) {
    const status = (err as { status?: number })?.status;
    // Re-fetch presign for: auth errors (403/400) OR persistent network failure (!status)
    if (status === 403 || status === 400 || !status) {
      const fresh = await initGuest(initBody);
      report(20);
      await makePut(fresh);
      report(88);
      const finalized2 = await finalizeGuest({
        photo_token: fresh.photo_token,
        s3_key: fresh.s3_key,
        pairing_session_id: sid,
        pairing_upload_token: tok,
      });
      report(100);
      return {
        id: finalized2.id,
        cdn_url: finalized2.cdn_url,
        width: finalized2.width,
        height: finalized2.height,
        bytes: finalized2.bytes,
        mime: finalized2.mime,
      };
    }
    throw err;
  }

  report(88);
  const finalized = await finalizeGuest({
    photo_token: init.photo_token,
    s3_key: init.s3_key,
    pairing_session_id: sid,
    pairing_upload_token: tok,
  });
  report(100);

  return {
    id: finalized.id,
    cdn_url: finalized.cdn_url,
    width: finalized.width,
    height: finalized.height,
    bytes: finalized.bytes,
    mime: finalized.mime,
  };
}
