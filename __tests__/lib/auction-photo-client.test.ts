/**
 * Integration-style tests for the auction photo upload pipeline.
 *
 * Covers the end-to-end contract from the browser's perspective:
 * compress -> init -> PUT (XHR) -> finalize -> UploadedPhoto.
 * Uses fetch and XMLHttpRequest mocks so no real network or Web Worker is
 * required.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api/refresh-token', () => ({
  tokenManager: {
    ensureFreshToken: vi.fn(async () => null),
  },
  refreshAccessToken: vi.fn(async () => null),
}));

// Make compressImage a no-op so we don't need a real canvas/Web Worker in jsdom.
vi.mock('browser-image-compression', () => ({
  default: vi.fn(async (file: File) => file),
}));

// crypto.subtle.digest in jsdom may be undefined; provide a deterministic stub.
function installCryptoSubtle() {
  const fakeDigest = async (_alg: string, buf: ArrayBuffer) => {
    // Deterministic 32 bytes derived from the input length for testing.
    const out = new Uint8Array(32);
    out[0] = buf.byteLength & 0xff;
    out[1] = (buf.byteLength >> 8) & 0xff;
    return out.buffer;
  };
  vi.stubGlobal('crypto', {
    ...(globalThis.crypto ?? {}),
    subtle: { digest: fakeDigest },
  });
}

class FakeXHR {
  static instances: FakeXHR[] = [];
  upload = { onprogress: undefined as ((e: ProgressEvent) => void) | undefined };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  status = 0;
  statusText = '';
  responseText = '';
  url = '';
  method = '';
  headers: Record<string, string> = {};
  bodySize = 0;
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  setRequestHeader(k: string, v: string) {
    this.headers[k] = v;
  }
  send(body: Blob | string) {
    this.bodySize = body instanceof Blob ? body.size : String(body).length;
    FakeXHR.instances.push(this);
  }
  abort() {
    this.onabort?.();
  }
}

function makeFile(name = 'photo.jpg', type = 'image/jpeg', size = 50_000): File {
  const data = new Uint8Array(size).fill(7);
  return new File([data], name, { type });
}

interface FetchCall {
  url: string;
  init?: RequestInit;
}

function setupFetch(handlers: Array<(call: FetchCall) => Response | Promise<Response>>) {
  const calls: FetchCall[] = [];
  let i = 0;
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const handler = handlers[Math.min(i, handlers.length - 1)];
    i += 1;
    if (!handler) throw new Error(`Unexpected fetch call to ${url}`);
    return handler({ url, init });
  });
  vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
  return { calls };
}

function jsonOk(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  installCryptoSubtle();
  FakeXHR.instances = [];
  vi.stubGlobal('XMLHttpRequest', FakeXHR as unknown as typeof XMLHttpRequest);
  // Token storage so authHeaders() returns Authorization.
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('ebartex_access_token', 'token-xyz');
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('ebartex_access_token');
  }
});

describe('uploadPhoto', () => {
  it('runs init -> PUT -> finalize and returns the photo descriptor', async () => {
    const { uploadPhoto } = await import('@/lib/api/auction-photo-client');

    const initResponse = {
      success: true,
      data: {
        upload_url: 'https://s3.example/bucket/pending/u/abc.jpg?sig=1',
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg', 'x-amz-meta-sha256': 'a'.repeat(64) },
        max_bytes: 6_000_000,
        photo_token: 'tok-1',
        s3_key: 'pending/u/abc.jpg',
        expires_in: 300,
      },
    };
    const finalizeResponse = {
      success: true,
      data: {
        id: 42,
        auction_id: null,
        user_id: 'u',
        position: 0,
        cdn_url: 'https://cdn.example/auctions/draft/u/abc.jpg',
        sha256: 'a'.repeat(64),
        width: null,
        height: null,
        bytes: 50_000,
        mime: 'image/jpeg',
        status: 'PENDING',
        created_at: new Date().toISOString(),
      },
    };

    const { calls } = setupFetch([
      () => jsonOk(initResponse),
      () => jsonOk(finalizeResponse, 201),
    ]);

    const file = makeFile();
    const promise = uploadPhoto(file);
    // Wait for the XHR to be initiated.
    await vi.waitFor(() => expect(FakeXHR.instances.length).toBe(1));
    const xhr = FakeXHR.instances[0]!;
    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 50_000, total: 50_000 } as ProgressEvent);
    xhr.status = 200;
    xhr.onload?.();

    const result = await promise;
    expect(result).toEqual({
      id: 42,
      cdn_url: 'https://cdn.example/auctions/draft/u/abc.jpg',
      width: null,
      height: null,
      bytes: 50_000,
      mime: 'image/jpeg',
    });

    expect(calls[0].url).toBe('/api/auctions/photos/init');
    expect(calls[1].url).toBe('/api/auctions/photos/finalize');
    expect(xhr.url).toBe(initResponse.data.upload_url);
    expect(xhr.headers['Content-Type']).toBe('image/jpeg');
    expect(xhr.headers['x-amz-meta-sha256']).toBe('a'.repeat(64));
  });

  it('reports progress via onProgress', async () => {
    const { uploadPhoto } = await import('@/lib/api/auction-photo-client');

    setupFetch([
      () =>
        jsonOk({
          success: true,
          data: {
            upload_url: 'https://s3.example/x',
            method: 'PUT',
            headers: { 'Content-Type': 'image/jpeg', 'x-amz-meta-sha256': 'b'.repeat(64) },
            max_bytes: 6_000_000,
            photo_token: 't2',
            s3_key: 'pending/u/x.jpg',
            expires_in: 300,
          },
        }),
      () =>
        jsonOk(
          {
            success: true,
            data: {
              id: 99,
              auction_id: null,
              user_id: 'u',
              position: 0,
              cdn_url: 'https://cdn.example/x',
              sha256: 'b'.repeat(64),
              width: null,
              height: null,
              bytes: 10,
              mime: 'image/jpeg',
              status: 'PENDING',
              created_at: new Date().toISOString(),
            },
          },
          201,
        ),
    ]);

    const seen: number[] = [];
    const promise = uploadPhoto(makeFile(), { onProgress: (p) => seen.push(p) });
    await vi.waitFor(() => expect(FakeXHR.instances.length).toBe(1));
    const xhr = FakeXHR.instances[0]!;
    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 25_000, total: 50_000 } as ProgressEvent);
    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 50_000, total: 50_000 } as ProgressEvent);
    xhr.status = 200;
    xhr.onload?.();
    await promise;
    expect(seen).toEqual([50, 100]);
  });

  it('retries with a fresh presign when S3 returns 403 (URL expired)', async () => {
    const { uploadPhoto } = await import('@/lib/api/auction-photo-client');

    const init1 = {
      success: true,
      data: {
        upload_url: 'https://s3.example/old',
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg', 'x-amz-meta-sha256': 'c'.repeat(64) },
        max_bytes: 6_000_000,
        photo_token: 'tk1',
        s3_key: 'pending/u/y.jpg',
        expires_in: 300,
      },
    };
    const init2 = {
      ...init1,
      data: { ...init1.data, upload_url: 'https://s3.example/fresh', photo_token: 'tk2', s3_key: 'pending/u/y2.jpg' },
    };
    const finalize2 = {
      success: true,
      data: {
        id: 7,
        auction_id: null,
        user_id: 'u',
        position: 0,
        cdn_url: 'https://cdn.example/y2',
        sha256: 'c'.repeat(64),
        width: null,
        height: null,
        bytes: 50_000,
        mime: 'image/jpeg',
        status: 'PENDING',
        created_at: new Date().toISOString(),
      },
    };

    const { calls } = setupFetch([
      () => jsonOk(init1),
      () => jsonOk(init2),
      () => jsonOk(finalize2, 201),
    ]);

    const promise = uploadPhoto(makeFile());
    // First XHR - will fail with 403.
    await vi.waitFor(() => expect(FakeXHR.instances.length).toBe(1));
    const xhr1 = FakeXHR.instances[0]!;
    xhr1.status = 403;
    xhr1.onload?.();
    // Second XHR - succeeds.
    await vi.waitFor(() => expect(FakeXHR.instances.length).toBe(2));
    const xhr2 = FakeXHR.instances[1]!;
    xhr2.status = 200;
    xhr2.onload?.();

    const result = await promise;
    expect(result.id).toBe(7);
    expect(calls.map((c) => c.url)).toEqual([
      '/api/auctions/photos/init',
      '/api/auctions/photos/init',
      '/api/auctions/photos/finalize',
    ]);
  });

  it('aborts the upload when the AbortSignal fires', async () => {
    const { uploadPhoto } = await import('@/lib/api/auction-photo-client');

    setupFetch([
      () =>
        jsonOk({
          success: true,
          data: {
            upload_url: 'https://s3.example/abort',
            method: 'PUT',
            headers: { 'Content-Type': 'image/jpeg', 'x-amz-meta-sha256': 'd'.repeat(64) },
            max_bytes: 6_000_000,
            photo_token: 't',
            s3_key: 'pending/u/a.jpg',
            expires_in: 300,
          },
        }),
    ]);

    const ac = new AbortController();
    const promise = uploadPhoto(makeFile(), { signal: ac.signal });
    await vi.waitFor(() => expect(FakeXHR.instances.length).toBe(1));
    ac.abort();
    await expect(promise).rejects.toThrow(/abort/i);
  });
});
