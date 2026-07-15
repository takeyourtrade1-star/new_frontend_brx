// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

function request(
  path: string,
  init: { method?: string; body?: string; headers?: Record<string, string> } = {},
): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: init.method ?? 'GET',
    body: init.body,
    headers: init.headers,
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
    expect(fetch).toHaveBeenCalledWith(
      new URL('http://brx-match.test:8005/brx-match/search-vector'),
      expect.objectContaining({ method: 'POST', cache: 'no-store' }),
    );
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
    const body = (await response.json()) as { edge: { enabled: boolean } };

    expect(body.edge.enabled).toBe(false);
    expect(response.headers.get('cache-control')).toMatch(/no-store/);
  });
});
