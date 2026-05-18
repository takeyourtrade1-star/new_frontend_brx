import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

function context(path: string[]) {
  return { params: Promise.resolve({ path }) };
}

function mockAuthBackend(data: unknown = { success: true }) {
  const fetchMock = vi.fn(async () => ({
    status: 200,
    json: async () => data,
    headers: {
      getSetCookie: () => [],
    },
  }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function loadRoute() {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_AUTH_API_URL', 'https://auth.example');
  vi.stubEnv('AUTH_INTERNAL_API_TOKEN', 'internal-secret');
  return import('@/app/api/auth/[...path]/route');
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('/api/auth proxy', () => {
  it('does not log sensitive query parameters while forwarding them', async () => {
    const fetchMock = mockAuthBackend();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const route = await loadRoute();

    await route.POST(
      new NextRequest('http://localhost/api/auth/mfa/verify?mfa_code=123456', {
        method: 'POST',
      }),
      context(['mfa', 'verify'])
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('mfa_code=123456');

    const logged = logSpy.mock.calls.flat().map(String).join(' ');
    expect(logged).toContain('/api/auth/mfa/verify');
    expect(logged).not.toContain('mfa_code');
    expect(logged).not.toContain('123456');
  });

  it('blocks non-public users subpaths instead of forwarding the internal token', async () => {
    const fetchMock = mockAuthBackend();
    const route = await loadRoute();

    const response = await route.POST(
      new NextRequest('http://localhost/api/auth/users/admin/delete', {
        method: 'POST',
      }),
      context(['users', 'admin', 'delete'])
    );

    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps the internal token for allowed public users lookups', async () => {
    const fetchMock = mockAuthBackend();
    const route = await loadRoute();

    await route.GET(
      new NextRequest('http://localhost/api/auth/users/search?q=alice', {
        method: 'GET',
      }),
      context(['users', 'search'])
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const options = fetchMock.mock.calls[0][1] as { headers?: Record<string, string> };
    expect(options.headers?.['X-Internal-Token']).toBe('internal-secret');
  });
});
