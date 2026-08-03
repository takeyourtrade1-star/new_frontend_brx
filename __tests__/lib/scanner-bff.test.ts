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
    headers: {
      'X-Scanner-Request': '1',
      ...init.headers,
    },
    signal: init.signal,
  });
}

beforeEach(() => {
  process.env.BRX_MATCH_API_URL = 'http://brx-match.test:8005';
  process.env.BRX_MATCH_SERVICE_TOKEN = 'scanner-service-token-at-least-32-characters';
  delete process.env.SCANNER_BUDGET_MODE;
  delete process.env.SCANNER_EDGE_ENABLED;
  delete process.env.SCANNER_EDGE_MODEL_BYTES;
  delete process.env.SCANNER_EDGE_MODEL_SHA256;
  delete process.env.BRX_MATCH_TRUSTED_ORIGINS;
  delete process.env.TRUSTED_CLIENT_IP_HEADER;
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  delete process.env.BRX_MATCH_API_URL;
  delete process.env.BRX_MATCH_SERVICE_TOKEN;
  delete process.env.SCANNER_BUDGET_MODE;
  delete process.env.SCANNER_EDGE_ENABLED;
  delete process.env.SCANNER_EDGE_MODEL_BYTES;
  delete process.env.SCANNER_EDGE_MODEL_SHA256;
  delete process.env.BRX_MATCH_ALLOW_PRIVATE_HTTP;
  delete process.env.BRX_MATCH_PRIVATE_HOST;
  delete process.env.BRX_MATCH_TRUSTED_ORIGINS;
  delete process.env.TRUSTED_CLIENT_IP_HEADER;
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('/api/scanner BFF', () => {
  it('rifiuta URL scanner HTTP o con credenziali in produzione', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { getBrxMatchBaseUrl } = await import('@/app/api/scanner/_config');

    process.env.BRX_MATCH_API_URL = 'http://brx-match.internal:8005';
    expect(getBrxMatchBaseUrl()).toBe('');

    process.env.BRX_MATCH_ALLOW_PRIVATE_HTTP = 'true';
    expect(getBrxMatchBaseUrl()).toBe('');

    process.env.BRX_MATCH_PRIVATE_HOST = 'brx-match.internal';
    process.env.BRX_MATCH_TRUSTED_ORIGINS = 'http://brx-match.internal:8005';
    expect(getBrxMatchBaseUrl()).toBe('http://brx-match.internal:8005');

    process.env.BRX_MATCH_API_URL = 'http://10.23.4.5:8005';
    process.env.BRX_MATCH_TRUSTED_ORIGINS = 'http://10.23.4.5:8005';
    expect(getBrxMatchBaseUrl()).toBe('http://10.23.4.5:8005');

    process.env.BRX_MATCH_API_URL = 'http://attacker.example:8005';
    expect(getBrxMatchBaseUrl()).toBe('');

    process.env.BRX_MATCH_API_URL = 'https://user:secret@scanner.example.com';
    expect(getBrxMatchBaseUrl()).toBe('');

    process.env.BRX_MATCH_API_URL = 'https://evil.example';
    process.env.BRX_MATCH_TRUSTED_ORIGINS = 'https://scanner.example.com';
    expect(getBrxMatchBaseUrl()).toBe('');
  });

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

  it('blocca richieste scanner cross-site prima di leggere il body o contattare Match', async () => {
    const body = new ReadableStream<Uint8Array>();
    const crossSiteRequest = new NextRequest(
      'http://localhost:3000/api/scanner/search-vector',
      {
        method: 'POST',
        body,
        headers: {
          Origin: 'https://attacker.example',
          'Sec-Fetch-Site': 'cross-site',
          'Content-Type': 'application/json',
        },
        duplex: 'half',
      } as unknown as ConstructorParameters<typeof NextRequest>[1],
    );
    const getReader = vi.spyOn(crossSiteRequest.body!, 'getReader');
    const { POST } = await import('@/app/api/scanner/[...path]/route');
    const response = await POST(crossSiteRequest, {
      params: Promise.resolve({ path: ['search-vector'] }),
    });

    expect(response.status).toBe(403);
    expect(getReader).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('interrompe un body chunked oltre limite senza bufferizzarlo tutto', async () => {
    const chunks = [new Uint8Array(20 * 1024), new Uint8Array(20 * 1024)];
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        const chunk = chunks.shift();
        if (chunk) controller.enqueue(chunk);
        else controller.close();
      },
    });
    const chunkedInit = {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      duplex: 'half',
    } as unknown as ConstructorParameters<typeof NextRequest>[1];
    const chunkedRequest = new NextRequest(
      'http://localhost:3000/api/scanner/search-vector',
      chunkedInit,
    );
    const { POST } = await import('@/app/api/scanner/[...path]/route');
    const response = await POST(chunkedRequest, {
      params: Promise.resolve({ path: ['search-vector'] }),
    });

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
    const upstreamHeaders = new Headers(vi.mocked(fetch).mock.calls[0]?.[1]?.headers);
    expect(upstreamHeaders.get('X-Internal-Caller')).toBe('web-bff');
    expect(upstreamHeaders.get('X-Internal-Token')).toBe(
      'scanner-service-token-at-least-32-characters',
    );
    expect(response.headers.has('X-Internal-Token')).toBe(false);
  });

  it('non inoltra il bearer e il sub JWT spoofato non influenza il rate subject trusted', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true, candidates: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    process.env.TRUSTED_CLIENT_IP_HEADER = 'cloudfront-viewer-address';
    const payload = Buffer.from(
      JSON.stringify({ sub: '01890c11-2222-7777-8888-abcdef012345' }),
    ).toString('base64url');
    const { POST } = await import('@/app/api/scanner/[...path]/route');
    const response = await POST(
      request('/api/scanner/search-vector', {
        method: 'POST',
        body: '{}',
        headers: {
          Authorization: `Bearer header.${payload}.signature`,
          'Content-Type': 'application/json',
          'CloudFront-Viewer-Address': '[2001:0DB8:0:0:0:0:0:1]:443',
          'X-Forwarded-For': '203.0.113.250',
        },
      }),
      { params: Promise.resolve({ path: ['search-vector'] }) },
    );

    expect(response.status).toBe(200);
    const upstreamHeaders = new Headers(vi.mocked(fetch).mock.calls[0]?.[1]?.headers);
    expect(upstreamHeaders.has('Authorization')).toBe(false);
    expect(upstreamHeaders.get('X-Internal-Rate-Subject')).toBe('ip:2001:db8::1');
    expect(upstreamHeaders.get('X-Internal-Rate-Subject')).not.toContain('01890c11');
    expect(upstreamHeaders.get('X-Internal-Rate-Subject')).not.toContain('203.0.113.250');
  });

  it('rifiuta una risposta recognition chunked oltre 2 MiB', async () => {
    const chunks = [new Uint8Array(1_100_000), new Uint8Array(1_100_000)];
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        new ReadableStream<Uint8Array>({
          pull(controller) {
            const chunk = chunks.shift();
            if (chunk) controller.enqueue(chunk);
            else controller.close();
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const { POST } = await import('@/app/api/scanner/[...path]/route');
    const response = await POST(
      request('/api/scanner/search-vector', {
        method: 'POST',
        body: '{}',
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ path: ['search-vector'] }) },
    );
    expect(response.status).toBe(502);
  });

  it.each([
    ['text/html', '<script>alert(1)</script>'],
    ['application/json; charset=utf-8', '{not-json'],
    ['application/json', 'not-json'],
  ])('rifiuta risposta recognition non JSON sicura: %s', async (contentType, payload) => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(payload, { status: 200, headers: { 'Content-Type': contentType } }),
    );
    const { POST } = await import('@/app/api/scanner/[...path]/route');
    const response = await POST(
      request('/api/scanner/search-vector', {
        method: 'POST',
        body: '{}',
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ path: ['search-vector'] }) },
    );

    expect(response.status).toBe(502);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    await expect(response.text()).resolves.not.toContain('<script>');
  });

  it('rifiuta modello senza Content-Length che supera il cap reale', async () => {
    process.env.SCANNER_EDGE_MODEL_BYTES = String(10 * 1024 * 1024);
    const chunks = [new Uint8Array(8 * 1024 * 1024), new Uint8Array(8 * 1024 * 1024)];
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        new ReadableStream<Uint8Array>({
          pull(controller) {
            const chunk = chunks.shift();
            if (chunk) controller.enqueue(chunk);
            else controller.close();
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/octet-stream' } },
      ),
    );
    const { GET } = await import('@/app/api/scanner/[...path]/route');
    const response = await GET(request('/api/scanner/static/dinov2_small.onnx'), {
      params: Promise.resolve({ path: ['static', 'dinov2_small.onnx'] }),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('x-scanner-response-mode')).toBe('streamed');
    expect(response.headers.get('content-disposition')).toBe(
      'attachment; filename="dinov2_small.onnx"',
    );
    expect(response.headers.get('cross-origin-resource-policy')).toBe('same-origin');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    await expect(response.arrayBuffer()).rejects.toThrow();
  });

  it('mantiene la deadline attiva fino alla fine dello stream modello', async () => {
    vi.useFakeTimers();
    try {
      process.env.SCANNER_EDGE_MODEL_BYTES = '100000';
      const cancel = vi.fn();
      let upstreamSignal: AbortSignal | undefined;
      vi.mocked(fetch).mockImplementation(async (_url, init) => {
        upstreamSignal = init?.signal ?? undefined;
        return new Response(
          new ReadableStream<Uint8Array>({
            pull: () => new Promise<void>(() => undefined),
            cancel,
          }),
          { status: 200, headers: { 'Content-Type': 'application/octet-stream' } },
        );
      });
      const { GET } = await import('@/app/api/scanner/[...path]/route');
      const response = await GET(request('/api/scanner/static/dinov2_small.onnx'), {
        params: Promise.resolve({ path: ['static', 'dinov2_small.onnx'] }),
      });
      const bodyRead = response.arrayBuffer();
      const rejectedRead = expect(bodyRead).rejects.toThrow('Scanner model stream aborted');

      await vi.advanceTimersByTimeAsync(60_000);

      await rejectedRead;
      expect(upstreamSignal?.aborted).toBe(true);
      expect(cancel).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('annulla lo stream upstream quando il client cancella il download modello', async () => {
    process.env.SCANNER_EDGE_MODEL_BYTES = '100000';
    const cancel = vi.fn();
    let upstreamSignal: AbortSignal | undefined;
    vi.mocked(fetch).mockImplementation(async (_url, init) => {
      upstreamSignal = init?.signal ?? undefined;
      return new Response(
        new ReadableStream<Uint8Array>({
          pull: () => new Promise<void>(() => undefined),
          cancel,
        }),
        { status: 200, headers: { 'Content-Type': 'application/octet-stream' } },
      );
    });
    const { GET } = await import('@/app/api/scanner/[...path]/route');
    const response = await GET(request('/api/scanner/static/dinov2_small.onnx'), {
      params: Promise.resolve({ path: ['static', 'dinov2_small.onnx'] }),
    });

    await response.body!.cancel('client disconnected');

    expect(upstreamSignal?.aborted).toBe(true);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it.each([
    [{ 'X-Scanner-Request': '' }, 'custom header assente'],
    [{ 'Sec-Fetch-Site': 'cross-site' }, 'fetch cross-site'],
    [{ 'Sec-Fetch-Dest': 'image' }, 'destinazione image'],
    [{ Origin: 'https://attacker.example' }, 'origin non esatta'],
    [{ Origin: 'origine malformata' }, 'origin malformata'],
  ])('blocca il download modello drive-by: %s (%s)', async (headers, _label) => {
    const { GET } = await import('@/app/api/scanner/[...path]/route');
    const response = await GET(
      request('/api/scanner/static/dinov2_small.onnx', { headers }),
      { params: Promise.resolve({ path: ['static', 'dinov2_small.onnx'] }) },
    );

    expect(response.status).toBe(403);
    expect(response.headers.get('cross-origin-resource-policy')).toBe('same-origin');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('in produzione fallisce chiuso senza service token', async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = 'production';
    process.env.APP_ORIGIN = 'https://www.ebartex.com';
    delete process.env.BRX_MATCH_SERVICE_TOKEN;
    try {
      const { POST } = await import('@/app/api/scanner/[...path]/route');
      const response = await POST(
        request('/api/scanner/search-vector', {
          method: 'POST',
          body: JSON.stringify({ vector: [0.1] }),
          headers: {
            'Content-Type': 'application/json',
            Origin: 'https://www.ebartex.com',
            'Sec-Fetch-Site': 'same-origin',
          },
        }),
        { params: Promise.resolve({ path: ['search-vector'] }) },
      );
      expect(response.status).toBe(503);
      expect(fetch).not.toHaveBeenCalled();
    } finally {
      if (previousNodeEnv === undefined) {
        delete (process.env as Record<string, string | undefined>).NODE_ENV;
      }
      else (process.env as Record<string, string>).NODE_ENV = previousNodeEnv;
      delete process.env.APP_ORIGIN;
    }
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
    const response = await GET(request('/api/scanner/capabilities'));
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

  it('abilita edge solo con capability autenticata, size esatta e SHA-256 valido', async () => {
    process.env.SCANNER_EDGE_ENABLED = 'true';
    process.env.SCANNER_EDGE_MODEL_BYTES = '87654321';
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'ok',
          pipeline_version: 'v2',
          model_loaded: true,
          index_ready: true,
          edge_model: { size: 87_654_321, sha256: 'a'.repeat(64) },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const { GET } = await import('@/app/api/scanner/capabilities/route');
    const response = await GET(request('/api/scanner/capabilities'));
    const body = await response.json() as {
      edge: { enabled: boolean; model_bytes: number; model_sha256: string };
    };

    expect(body.edge).toMatchObject({
      enabled: true,
      model_bytes: 87_654_321,
      model_sha256: 'a'.repeat(64),
    });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/brx-match/capabilities'),
      expect.objectContaining({
        redirect: 'error',
        headers: expect.objectContaining({ 'Accept-Encoding': 'identity' }),
      }),
    );
  });

  it('disabilita edge quando manifest e configurazione non coincidono', async () => {
    process.env.SCANNER_EDGE_ENABLED = 'true';
    process.env.SCANNER_EDGE_MODEL_BYTES = '25000001';
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'ok',
          pipeline_version: 'v2',
          model_loaded: true,
          index_ready: true,
          edge_model: { size: 25_000_000, sha256: 'a'.repeat(64) },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const { GET } = await import('@/app/api/scanner/capabilities/route');
    const response = await GET(request('/api/scanner/capabilities'));
    const body = await response.json() as { edge: { enabled: boolean } };
    expect(body.edge.enabled).toBe(false);
  });

  it('disabilita edge quando la capability non coincide con lo SHA-256 pinned', async () => {
    process.env.SCANNER_EDGE_ENABLED = 'true';
    process.env.SCANNER_EDGE_MODEL_BYTES = '25000000';
    process.env.SCANNER_EDGE_MODEL_SHA256 = 'b'.repeat(64);
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'ok',
          pipeline_version: 'v2',
          model_loaded: true,
          index_ready: true,
          edge_model: { size: 25_000_000, sha256: 'a'.repeat(64) },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const { GET } = await import('@/app/api/scanner/capabilities/route');
    const response = await GET(request('/api/scanner/capabilities'));
    const body = await response.json() as { edge: { enabled: boolean } };
    expect(body.edge.enabled).toBe(false);
  });

  it('richiede un digest lowercase valido quando edge è abilitato in produzione', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.SCANNER_EDGE_ENABLED = 'true';
    process.env.SCANNER_EDGE_MODEL_BYTES = '25000000';
    const { isScannerEdgeEnabled } = await import('@/app/api/scanner/_config');

    delete process.env.SCANNER_EDGE_MODEL_SHA256;
    expect(isScannerEdgeEnabled()).toBe(false);
    process.env.SCANNER_EDGE_MODEL_SHA256 = 'A'.repeat(64);
    expect(isScannerEdgeEnabled()).toBe(false);
    process.env.SCANNER_EDGE_MODEL_SHA256 = 'a'.repeat(64);
    expect(isScannerEdgeEnabled()).toBe(true);
  });
});
