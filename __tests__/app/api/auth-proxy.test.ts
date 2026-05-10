import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

async function loadAuthRoute() {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_AUTH_API_URL', 'https://auth.example.test');
  vi.stubEnv('AUTH_INTERNAL_API_TOKEN', 'internal-secret');
  return import('@/app/api/auth/[...path]/route');
}

function mockBackend() {
  const fetchMock = vi.fn(async () => ({
    status: 200,
    json: async () => ({ success: true }),
    headers: { getSetCookie: () => [] },
  }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function forwardedHeaders(fetchMock: ReturnType<typeof mockBackend>): Record<string, string> {
  const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
  return (init?.headers ?? {}) as Record<string, string>;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('auth proxy internal users token', () => {
  it('attaches the internal token only to public user lookup endpoints', async () => {
    const fetchMock = mockBackend();
    const { GET } = await loadAuthRoute();

    await GET(
      new NextRequest('https://app.example.test/api/auth/users/public?ids=u1'),
      { params: Promise.resolve({ path: ['users', 'public'] }) },
    );

    expect(forwardedHeaders(fetchMock)['X-Internal-Token']).toBe('internal-secret');
  });

  it('does not attach the internal token to arbitrary user-management paths', async () => {
    const fetchMock = mockBackend();
    const { GET } = await loadAuthRoute();

    await GET(
      new NextRequest('https://app.example.test/api/auth/users/123'),
      { params: Promise.resolve({ path: ['users', '123'] }) },
    );

    expect(forwardedHeaders(fetchMock)['X-Internal-Token']).toBeUndefined();
  });

  it('does not attach the internal token to non-GET user requests', async () => {
    const fetchMock = mockBackend();
    const { POST } = await loadAuthRoute();

    await POST(
      new NextRequest('https://app.example.test/api/auth/users/public', {
        method: 'POST',
        body: '{}',
        headers: { 'content-type': 'application/json' },
      }),
      { params: Promise.resolve({ path: ['users', 'public'] }) },
    );

    expect(forwardedHeaders(fetchMock)['X-Internal-Token']).toBeUndefined();
  });
});
