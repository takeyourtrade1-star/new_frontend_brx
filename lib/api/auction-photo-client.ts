/**
 * Auction photo upload client (Direct-to-S3 with presigned URL).
 *
 * Pipeline executed entirely in the browser:
 *  1) compressImage(file): resize to 2048px, WebP, ~500 KB, EXIF stripped.
 *  2) hash(file): SHA-256 via crypto.subtle.
 *  3) POST /api/auctions/photos/init  -> presigned PUT URL.
 *  4) PUT body straight to S3 with progress events (XHR).
 *  5) POST /api/auctions/photos/finalize -> server registers the row.
 *
 * Retries the init/finalize steps on 5xx with exponential backoff. The PUT
 * to S3 is retried with a fresh presign in case the URL expired between
 * steps 3 and 4 (rare but possible on slow networks).
 */

import imageCompression from 'browser-image-compression';
import { refreshAccessToken } from '@/lib/api/refresh-token';
import { authApi } from '@/lib/api/auth-client';
import { useAuthStore } from '@/lib/stores/auth-store';

export interface UploadedPhoto {
  id: number;
  cdn_url: string;
  width: number | null;
  height: number | null;
  bytes: number;
  mime: string;
}

export interface UploadOptions {
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

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
  auction_id: number | null;
  user_id: string;
  position: number;
  cdn_url: string;
  sha256: string;
  width: number | null;
  height: number | null;
  bytes: number;
  mime: string;
  status: 'PENDING' | 'PUBLISHED' | 'DELETED';
  created_at: string;
}

const COMPRESSION_TARGET = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 2048,
  initialQuality: 0.82,
  fileType: 'image/webp' as const,
  useWebWorker: true,
};

const MAX_INIT_FINALIZE_RETRIES = 3;
const INIT_FINALIZE_BACKOFF_MS = [400, 1200, 3000];

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = window.localStorage.getItem('ebartex_access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function jsonRequest<T>(
  path: string,
  init: RequestInit = {},
  retried = false,
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && !retried && typeof window !== 'undefined') {
      const result = await refreshAccessToken();
      if (result) {
        authApi.setToken(result.accessToken, result.refreshToken);
        useAuthStore.getState().setToken(result.accessToken, result.refreshToken);
        return jsonRequest<T>(path, init, true);
      }
    }
    const message =
      data?.detail || data?.error || data?.message || `HTTP ${res.status}`;
    const err = new Error(message) as Error & {
      status: number;
      code?: string;
      data: unknown;
    };
    err.status = res.status;
    err.code = data?.code;
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

async function readImageDimensions(
  file: Blob,
): Promise<{ width: number | null; height: number | null }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file);
      const out = { width: bmp.width, height: bmp.height };
      bmp.close?.();
      return out;
    } catch {
      // fall through
    }
  }
  return { width: null, height: null };
}

export async function compressImage(file: File): Promise<File> {
  // browser-image-compression respects EXIF orientation and strips metadata
  // when fileType is set explicitly (it re-encodes via canvas).
  const compressed = await imageCompression(file, COMPRESSION_TARGET);
  // Ensure we hand a `File` (the lib already returns one in modern envs).
  if (compressed instanceof File) return compressed;
  return new File([compressed], file.name.replace(/\.[a-z0-9]+$/i, '.webp'), {
    type: 'image/webp',
    lastModified: Date.now(),
  });
}

function putToS3(
  upload: PhotoInitResponse,
  body: Blob,
  options: UploadOptions,
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

async function initUpload(args: {
  filename: string;
  content_type: string;
  size: number;
  sha256: string;
}): Promise<PhotoInitResponse> {
  const res = await withRetry(() =>
    jsonRequest<{ success: boolean; data: PhotoInitResponse }>(
      '/api/auctions/photos/init',
      {
        method: 'POST',
        body: JSON.stringify(args),
      },
    ),
  );
  return res.data;
}

async function finalizeUpload(args: {
  photo_token: string;
  s3_key: string;
}): Promise<PhotoFinalizeResponse> {
  const res = await withRetry(() =>
    jsonRequest<{ success: boolean; data: PhotoFinalizeResponse }>(
      '/api/auctions/photos/finalize',
      {
        method: 'POST',
        body: JSON.stringify(args),
      },
    ),
  );
  return res.data;
}

export async function uploadPhoto(
  rawFile: File,
  options: UploadOptions = {},
): Promise<UploadedPhoto> {
  const compressed = await compressImage(rawFile);
  options.signal?.throwIfAborted?.();

  const [sha256, dims] = await Promise.all([
    sha256Hex(compressed),
    readImageDimensions(compressed),
  ]);
  options.signal?.throwIfAborted?.();

  const init = await initUpload({
    filename: compressed.name || 'photo.webp',
    content_type: compressed.type || 'image/webp',
    size: compressed.size,
    sha256,
  });

  // PUT to S3 with one fresh-presign retry: if S3 returns 403 the URL likely
  // expired or signature drifted (e.g. clock skew). We retry once with a new
  // presign URL before giving up.
  try {
    await putToS3(init, compressed, options);
  } catch (err) {
    const status = (err as { status?: number })?.status;
    if (status === 403 || status === 400) {
      const fresh = await initUpload({
        filename: compressed.name || 'photo.webp',
        content_type: compressed.type || 'image/webp',
        size: compressed.size,
        sha256,
      });
      await putToS3(fresh, compressed, options);
      const finalized2 = await finalizeUpload({
        photo_token: fresh.photo_token,
        s3_key: fresh.s3_key,
      });
      return {
        id: finalized2.id,
        cdn_url: finalized2.cdn_url,
        width: finalized2.width ?? dims.width,
        height: finalized2.height ?? dims.height,
        bytes: finalized2.bytes,
        mime: finalized2.mime,
      };
    }
    throw err;
  }

  const finalized = await finalizeUpload({
    photo_token: init.photo_token,
    s3_key: init.s3_key,
  });

  return {
    id: finalized.id,
    cdn_url: finalized.cdn_url,
    width: finalized.width ?? dims.width,
    height: finalized.height ?? dims.height,
    bytes: finalized.bytes,
    mime: finalized.mime,
  };
}

export async function deletePhoto(photoId: number): Promise<void> {
  await jsonRequest(`/api/auctions/photos/${photoId}`, { method: 'DELETE' });
}
