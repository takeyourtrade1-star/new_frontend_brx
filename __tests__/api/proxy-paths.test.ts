import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });

describe('catch-all API proxies', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('AUCTION_API_URL', 'https://auction.example');
    vi.stubEnv('NEXT_PUBLIC_AUCTION_API_URL', '');
    vi.stubEnv('NEXT_PUBLIC_AUTH_API_URL', 'https://auth.example');
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ success: true })));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('rejects traversal segments before forwarding auction requests', async () => {
    const { GET } = await import('@/app/api/auctions/[...path]/route');
    const response = await GET(
      new NextRequest('http://localhost/api/auctions/%2e%2e/internal'),
      { params: Promise.resolve({ path: ['..', 'internal'] }) }
    );

    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects traversal even after an allowed auth prefix', async () => {
    const { GET } = await import('@/app/api/auth/[...path]/route');
    const response = await GET(
      new NextRequest('http://localhost/api/auth/users/%2e%2e/internal'),
      { params: Promise.resolve({ path: ['users', '..', 'internal'] }) }
    );

    expect(response.status).toBe(404);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('keeps safe auction paths under the auction prefix and forwards pairing tokens', async () => {
    const { GET } = await import('@/app/api/auctions/[...path]/route');
    const request = new NextRequest(
      'http://localhost/api/auctions/photos/pairing-sessions/session%201?force=true',
      {
        headers: {
          'X-Pairing-Upload-Token': 'upload-secret',
        },
      }
    );

    const response = await GET(request, {
      params: Promise.resolve({ path: ['photos', 'pairing-sessions', 'session 1'] }),
    });

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledWith(
      'https://auction.example/auctions/photos/pairing-sessions/session%201?force=true',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Pairing-Upload-Token': 'upload-secret',
        }),
      })
    );
  });
});
