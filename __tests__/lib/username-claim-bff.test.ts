// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const ACCESS_COOKIE =
  'ebartex_access_token=eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJsZWdhY3ktdXNlciJ9.signature';

function request(origin = 'http://localhost:3000'): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/username', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: ACCESS_COOKIE,
      Origin: origin,
    },
    body: JSON.stringify({ username: 'nuovo_user' }),
  });
}

beforeEach(() => {
  vi.resetModules();
  (process.env as Record<string, string>).NODE_ENV = 'development';
  process.env.AUTH_API_URL = 'http://127.0.0.1:8000';
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (process.env as Record<string, string | undefined>).NODE_ENV;
  delete process.env.AUTH_API_URL;
});

describe('PATCH /api/auth/username', () => {
  it('inoltra cookie, body e metodo al backend senza esporre token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'legacy-user',
          email: 'legacy@example.com',
          username: 'nuovo_user',
          can_claim_username: false,
          account_status: 'active',
          mfa_enabled: false,
          created_at: '2025-01-01T00:00:00Z',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { PATCH } = await import('@/app/api/auth/[...path]/route');
    const response = await PATCH(request(), {
      params: Promise.resolve({ path: ['username'] }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toMatch(/no-store/);
    expect(await response.json()).toMatchObject({
      username: 'nuovo_user',
      can_claim_username: false,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/auth/username',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ username: 'nuovo_user' }),
        cache: 'no-store',
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Bearer /),
        }),
      }),
    );
  });

  it('blocca una mutazione cross-origin prima del backend', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { PATCH } = await import('@/app/api/auth/[...path]/route');
    const response = await PATCH(request('https://evil.example'), {
      params: Promise.resolve({ path: ['username'] }),
    });

    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
