// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { normalizeProxyPathSegments } from '@/app/api/_lib/safe-proxy-path';

describe('normalizeProxyPathSegments', () => {
  it.each([
    ['..'],
    ['%2e%2e'],
    ['%252e%252e'],
    ['orders%2fprivate'],
    ['orders%5cprivate'],
    [''],
  ])('rifiuta il segmento %s', (segment) => {
    expect(normalizeProxyPathSegments([segment])).toBeNull();
  });

  it('ricodifica i segmenti validi senza cambiare la gerarchia', () => {
    expect(normalizeProxyPathSegments(['listings', 'public', 'carta rara'])).toBe(
      'listings/public/carta%20rara',
    );
  });
});

describe('/api/marketplace path e rate limit', () => {
  beforeEach(() => {
    process.env.MARKETPLACE_API_URL = 'https://marketplace-api.test';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () =>
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
  });

  it('rifiuta dot-segment prima di chiamare il backend', async () => {
    const { GET } = await import('@/app/api/marketplace/[...path]/route');
    const request = new NextRequest('http://localhost:3000/api/marketplace/listings/public/test');
    const response = await GET(request, {
      params: Promise.resolve({ path: ['listings', 'public', '%252e%252e', 'orders'] }),
    });

    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('limita anche il catalogo pubblico', async () => {
    const { GET } = await import('@/app/api/marketplace/[...path]/route');
    const context = {
      params: Promise.resolve({ path: ['listings', 'public', 'by-blueprint', '123'] }),
    };

    for (let requestNumber = 0; requestNumber < 60; requestNumber += 1) {
      const request = new NextRequest(
        'http://localhost:3000/api/marketplace/listings/public/by-blueprint/123',
        { headers: { 'x-forwarded-for': '198.51.100.77' } },
      );
      const response = await GET(request, context);
      expect(response.status).toBe(200);
    }

    const blockedRequest = new NextRequest(
      'http://localhost:3000/api/marketplace/listings/public/by-blueprint/123',
      { headers: { 'x-forwarded-for': '198.51.100.77' } },
    );
    const blockedResponse = await GET(blockedRequest, context);

    expect(blockedResponse.status).toBe(429);
    expect(blockedResponse.headers.get('retry-after')).toBeTruthy();
  });
});
