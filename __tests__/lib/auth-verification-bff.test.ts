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
