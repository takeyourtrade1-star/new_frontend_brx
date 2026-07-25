// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

function postRequest(path: string, body: unknown, headers?: Record<string, string>) {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe('auth verification BFF', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_AUTH_API_URL = 'http://auth-api.test';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.NEXT_PUBLIC_AUTH_API_URL;
    delete process.env.AUTH_INTERNAL_API_TOKEN;
  });

  it('forwards verify-email/code without requiring a session', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'verified',
          verified_at: '2026-07-13T15:02:00Z',
          next_action: 'login',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');

    const request = postRequest('/api/auth/verify-email/code', {
      flow_id: '0198f65d-88e7-7f38-9c71-6b28ea26eb9d',
      code: '123456',
    });
    const response = await POST(request, {
      params: Promise.resolve({ path: ['verify-email', 'code'] }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toMatch(/no-store/);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://auth-api.test/api/auth/verify-email/code',
      expect.objectContaining({ method: 'POST', cache: 'no-store' })
    );
  });

  it('forwards the registration idempotency key', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'verification_pending' }), {
        status: 202,
        headers: { 'content-type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');

    const request = postRequest(
      '/api/auth/register',
      { email: 'test@example.com' },
      { 'idempotency-key': 'idem-123' }
    );
    await POST(request, {
      params: Promise.resolve({ path: ['register'] }),
    });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).toMatchObject({ 'Idempotency-Key': 'idem-123' });
  });

  it.each([
    ['/api/auth/login', ['login']],
    ['/api/auth/login/code/verify', ['login', 'code', 'verify']],
  ] as const)(
    'forwards only the MFA trust cookie to %s',
    async (requestPath, pathSegments) => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ access_token: 'access', refresh_token: 'refresh' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );
      vi.stubGlobal('fetch', fetchMock);
      const { POST } = await import('@/app/api/auth/[...path]/route');

      const request = postRequest(
        requestPath,
        { remember_device: true },
        {
          cookie:
            '__Host-ebartex_mfa_trust=opaque-device-token; ebartex_access_token=do-not-forward; analytics_id=do-not-forward',
          'user-agent': 'Trusted Device Browser/1.0',
        }
      );
      await POST(request, { params: Promise.resolve({ path: [...pathSegments] }) });

      const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
      expect(init.headers).toMatchObject({
        Cookie: '__Host-ebartex_mfa_trust=opaque-device-token',
        'User-Agent': 'Trusted Device Browser/1.0',
      });
      expect(init.body).toBe(JSON.stringify({ remember_device: true }));
    }
  );

  it('does not forward the MFA trust cookie to unrelated auth endpoints', async () => {
    const unexpectedTrustCookie =
      '__Host-ebartex_mfa_trust=must-not-be-accepted; Path=/; Max-Age=2592000';
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'verification_pending' }), {
        status: 202,
        headers: {
          'content-type': 'application/json',
          'set-cookie': unexpectedTrustCookie,
        },
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');

    const request = postRequest(
      '/api/auth/register',
      { email: 'test@example.com' },
      { cookie: '__Host-ebartex_mfa_trust=opaque-device-token' }
    );
    const response = await POST(request, {
      params: Promise.resolve({ path: ['register'] }),
    });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).not.toHaveProperty('Cookie');
    expect(response.headers.getSetCookie()).not.toContain(unexpectedTrustCookie);
  });

  it('propagates a canonical secure MFA trust cookie from verify-mfa', async () => {
    const upstreamTrustCookie =
      '__Host-ebartex_mfa_trust=opaque-device-token; Domain=.auth.example; Path=/other; Max-Age=99999999; SameSite=None';
    const canonicalTrustCookie =
      '__Host-ebartex_mfa_trust=opaque-device-token; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000';
    const upstreamHeaders = new Headers({ 'content-type': 'application/json' });
    upstreamHeaders.append('set-cookie', upstreamTrustCookie);
    upstreamHeaders.append(
      'set-cookie',
      'backend_session=do-not-forward; Path=/; HttpOnly; Secure; SameSite=Lax'
    );
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ access_token: 'access', refresh_token: 'refresh' }), {
        status: 200,
        headers: upstreamHeaders,
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');

    const request = postRequest(
      '/api/auth/verify-mfa',
      {
        pre_auth_token: 'pre-auth',
        mfa_code: '123456',
        remember_device: true,
      },
      {
        cookie: '__Host-ebartex_mfa_trust=stale-token-not-needed-for-issuance',
        'user-agent': 'Trusted Device Browser/1.0',
      }
    );
    const response = await POST(request, {
      params: Promise.resolve({ path: ['verify-mfa'] }),
    });

    const responseCookies = response.headers.getSetCookie();
    expect(responseCookies).toContain(canonicalTrustCookie);
    expect(responseCookies).not.toContain(upstreamTrustCookie);
    expect(responseCookies.some((cookie) => cookie.startsWith('backend_session='))).toBe(false);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).toMatchObject({
      'User-Agent': 'Trusted Device Browser/1.0',
    });
    expect(init.headers).not.toHaveProperty('Cookie');
  });

  it('propagates the rotated MFA trust cookie from login', async () => {
    const rotatedTrustCookie =
      '__Host-ebartex_mfa_trust=rotated-device-token; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000';
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ access_token: 'access', refresh_token: 'refresh' }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'set-cookie': rotatedTrustCookie,
        },
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');

    const request = postRequest(
      '/api/auth/login',
      { email: 'test@example.com', password: 'correct horse battery staple' },
      { cookie: '__Host-ebartex_mfa_trust=previous-device-token' }
    );
    const response = await POST(request, {
      params: Promise.resolve({ path: ['login'] }),
    });

    expect(response.headers.getSetCookie()).toContain(rotatedTrustCookie);
    const body = await response.json();
    expect(body.access_token).toBe('access');
    expect(body.refresh_token).toBeUndefined();
  });

  it('refreshes from the HttpOnly cookie, ignores the browser body and redacts refresh_token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: 'rotated-access',
          refresh_token: 'rotated-refresh',
          token_type: 'bearer',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');

    const request = postRequest(
      '/api/auth/refresh',
      { refresh_token: 'attacker-controlled-body-token' },
      { cookie: 'ebartex_refresh_token=http-only-cookie-token' }
    );
    const response = await POST(request, {
      params: Promise.resolve({ path: ['refresh'] }),
    });

    expect(response.status).toBe(200);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.body).toBe(
      JSON.stringify({ refresh_token: 'http-only-cookie-token' })
    );
    const body = await response.json();
    expect(body).toMatchObject({ access_token: 'rotated-access' });
    expect(body.refresh_token).toBeUndefined();
    expect(
      response.headers
        .getSetCookie()
        .some((cookie) =>
          cookie.includes('ebartex_refresh_token=rotated-refresh')
        )
    ).toBe(true);
  });

  it('rejects refresh without the HttpOnly cookie before contacting auth', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');

    const response = await POST(
      postRequest('/api/auth/refresh', { refresh_token: 'legacy-js-token' }),
      { params: Promise.resolve({ path: ['refresh'] }) }
    );

    expect(response.status).toBe(401);
    expect(response.headers.get('cache-control')).toMatch(/no-store/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('blocks the internal contacts route even when an internal token env exists', async () => {
    process.env.AUTH_INTERNAL_API_TOKEN = 'must-never-be-forwarded';
    vi.resetModules();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { GET } = await import('@/app/api/auth/[...path]/route');
    const request = new NextRequest(
      'http://localhost:3000/api/auth/users/internal/contact?ids=00000000-0000-0000-0000-000000000001'
    );

    const response = await GET(request, {
      params: Promise.resolve({ path: ['users', 'internal', 'contact'] }),
    });

    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
    delete process.env.AUTH_INTERNAL_API_TOKEN;
  });

  it('allows only the exact public user resolver without an internal token', async () => {
    process.env.AUTH_INTERNAL_API_TOKEN = 'must-never-be-forwarded';
    vi.resetModules();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const { GET } = await import('@/app/api/auth/[...path]/route');
    const request = new NextRequest(
      'http://localhost:3000/api/auth/users/public?ids=00000000-0000-0000-0000-000000000001'
    );

    const response = await GET(request, {
      params: Promise.resolve({ path: ['users', 'public'] }),
    });

    expect(response.status).toBe(200);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).not.toHaveProperty('X-Internal-Token');
    delete process.env.AUTH_INTERNAL_API_TOKEN;
  });

  it('blocks unlisted descendants of a public username route', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { GET } = await import('@/app/api/auth/[...path]/route');
    const request = new NextRequest(
      'http://localhost:3000/api/auth/users/alice/private'
    );

    const response = await GET(request, {
      params: Promise.resolve({ path: ['users', 'alice', 'private'] }),
    });

    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects oversized auth bodies before contacting the upstream service', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');
    const request = postRequest('/api/auth/register', {
      email: 'test@example.com',
      padding: 'x'.repeat(129 * 1024),
    });

    const response = await POST(request, {
      params: Promise.resolve({ path: ['register'] }),
    });

    expect(response.status).toBe(413);
    expect(response.headers.get('cache-control')).toMatch(/no-store/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('propagates la cancellazione del cookie trusted-device', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ mfa_required: true, pre_auth_token: 'pre-auth' }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'set-cookie': '__Host-ebartex_mfa_trust=; Path=/; Max-Age=0',
        },
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');

    const request = postRequest(
      '/api/auth/login',
      { email: 'test@example.com', password: 'correct horse battery staple' },
      { cookie: '__Host-ebartex_mfa_trust=expired-device-token' }
    );
    const response = await POST(request, {
      params: Promise.resolve({ path: ['login'] }),
    });

    expect(response.headers.getSetCookie()).toContain(
      '__Host-ebartex_mfa_trust=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
    );
  });
});
