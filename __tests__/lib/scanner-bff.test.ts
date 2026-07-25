// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

function request(
  path: string,
  init: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  } = {},
): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: init.method ?? 'GET',
    body: init.body,
    headers: init.headers,
    signal: init.signal,
  });
}

beforeEach(() => {
  process.env.BRX_MATCH_API_URL = 'http://brx-match.test:8005';
  delete process.env.SCANNER_BUDGET_MODE;
  delete process.env.SCANNER_EDGE_ENABLED;
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  delete process.env.BRX_MATCH_API_URL;
  delete process.env.SCANNER_BUDGET_MODE;
  delete process.env.SCANNER_EDGE_ENABLED;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('/api/scanner BFF', () => {
  it('rifiuta endpoint non in allowlist senza contattare il backend', async () => {
    const { GET } = await import('@/app/api/scanner/[...path]/route');
    const response = await GET(request('/api/scanner/admin'), {
      params: Promise.resolve({ path: ['admin'] }),
    });

    expect(response.status).toBe(404);
    expect(fetch).not.toHaveBeenCalled();
    expect(response.headers.get('cache-control')).toMatch(/no-store/);
  });

  it('rifiuta un payload dichiarato oltre il limite prima del proxy', async () => {
    const { POST } = await import('@/app/api/scanner/[...path]/route');
    const response = await POST(
      request('/api/scanner/search-vector', {
        method: 'POST',
        body: '{}',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': String(40 * 1024),
        },
      }),
      { params: Promise.resolve({ path: ['search-vector'] }) },
    );

    expect(response.status).toBe(413);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('inoltra la singola ricerca vettoriale con no-store', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true, candidates: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const { POST } = await import('@/app/api/scanner/[...path]/route');
    const body = JSON.stringify({ vector: [0.1, 0.2], top_k: 5, mode: 'fast' });
    const response = await POST(
      request('/api/scanner/search-vector', {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ path: ['search-vector'] }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toMatch(/no-store/);
    expect(response.headers.get('x-scanner-upstream-timeout-ms')).toBe('2800');
    expect(response.headers.get('x-scanner-response-mode')).toBe('buffered');
    expect(response.headers.get('server-timing')).toMatch(/request_body;dur=/);
    expect(response.headers.get('server-timing')).toMatch(/upstream_ttfb;dur=/);
    expect(response.headers.get('server-timing')).toMatch(/upstream_body;dur=/);
    expect(response.headers.get('server-timing')).toMatch(/upstream_total;dur=/);
    expect(response.headers.get('server-timing')).toMatch(/response_prep;dur=/);
    expect(response.headers.get('server-timing')).toMatch(/bff_total;dur=/);
    expect(fetch).toHaveBeenCalledWith(
      new URL('http://brx-match.test:8005/brx-match/search-vector'),
      expect.objectContaining({ method: 'POST', cache: 'no-store' }),
    );
  });

  it('interrompe il matcher quando il client annulla la richiesta', async () => {
    const clientController = new AbortController();
    vi.mocked(fetch).mockImplementation((_url, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(new DOMException('Aborted', 'AbortError')),
          { once: true },
        );
      });
    });

    const { POST } = await import('@/app/api/scanner/[...path]/route');
    const responsePromise = POST(
      request('/api/scanner/search-vector', {
        method: 'POST',
        body: JSON.stringify({ vector: [0.1, 0.2] }),
        headers: { 'Content-Type': 'application/json' },
        signal: clientController.signal,
      }),
      { params: Promise.resolve({ path: ['search-vector'] }) },
    );

    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    clientController.abort();
    const response = await responsePromise;
    const body = (await response.json()) as { code?: string };

    expect(response.status).toBe(499);
    expect(body.code).toBe('SCANNER_CLIENT_ABORTED');
    expect(response.headers.get('x-scanner-abort-cause')).toBe('client');
    expect(vi.mocked(fetch).mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  });

  it('restituisce un 504 diagnostico prima del timeout client', async () => {
    vi.useFakeTimers();
    try {
      vi.mocked(fetch).mockImplementation((_url, init) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true },
          );
        });
      });

      const { POST } = await import('@/app/api/scanner/[...path]/route');
      const responsePromise = POST(
        request('/api/scanner/scan', {
          method: 'POST',
          body: 'frame',
          headers: { 'Content-Type': 'image/jpeg' },
        }),
        { params: Promise.resolve({ path: ['scan'] }) },
      );

      await vi.advanceTimersByTimeAsync(2_800);
      const response = await responsePromise;
      const body = (await response.json()) as { code?: string; timeout_ms?: number };

      expect(response.status).toBe(504);
      expect(body).toMatchObject({
        code: 'SCANNER_UPSTREAM_TIMEOUT',
        timeout_ms: 2_800,
      });
      expect(response.headers.get('x-scanner-abort-cause')).toBe('timeout');
      expect(response.headers.get('server-timing')).toMatch(/upstream_total;dur=/);
    } finally {
      vi.useRealTimers();
    }
  });

  it('in edge_only blocca scan e verify invece di aumentare compute', async () => {
    process.env.SCANNER_BUDGET_MODE = 'edge_only';
    const { POST } = await import('@/app/api/scanner/[...path]/route');
    const response = await POST(
      request('/api/scanner/scan', { method: 'POST', body: 'frame' }),
      { params: Promise.resolve({ path: ['scan'] }) },
    );

    expect(response.status).toBe(503);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('non abilita edge senza opt-in esplicito anche se il backend è v2', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'ok',
          model_loaded: true,
          pipeline_version: 'v2',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const { GET } = await import('@/app/api/scanner/capabilities/route');
    const response = await GET();
    const body = (await response.json()) as {
      edge: { enabled: boolean };
      timeouts: { client_request_ms: number; recognition_upstream_ms: number };
    };

    expect(body.edge.enabled).toBe(false);
    expect(body.timeouts).toMatchObject({
      client_request_ms: 3_200,
      recognition_upstream_ms: 2_800,
    });
    expect(response.headers.get('cache-control')).toMatch(/no-store/);
  });
});
