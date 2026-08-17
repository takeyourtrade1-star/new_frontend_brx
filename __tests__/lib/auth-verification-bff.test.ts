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
    process.env.AUTH_API_URL = 'http://127.0.0.1:8000';
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.doUnmock('@/app/api/_lib/rate-limit');
    vi.doUnmock('@/lib/server-runtime-env');
    delete process.env.AUTH_API_URL;
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
      'http://127.0.0.1:8000/api/auth/verify-email/code',
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
    ['short', 'short'],
    ['oversized', `a${'b'.repeat(128)}`],
    ['non-ASCII', 'idempotency-caf\u00e9'],
  ])('drops a %s idempotency key at the trust boundary', async (_label, key) => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'verification_pending' }), {
        status: 202,
        headers: { 'content-type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');

    await POST(
      postRequest(
        '/api/auth/register',
        { email: 'test@example.com' },
        { 'idempotency-key': key }
      ),
      { params: Promise.resolve({ path: ['register'] }) }
    );

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).not.toHaveProperty('Idempotency-Key');
  });

  it('normalizes the upstream request content type to JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'verification_pending' }), {
        status: 202,
        headers: { 'content-type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');

    await POST(
      postRequest(
        '/api/auth/register',
        { email: 'test@example.com' },
        { 'content-type': 'text/plain; charset=utf-8' }
      ),
      { params: Promise.resolve({ path: ['register'] }) }
    );

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
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
        cookie: '__Host-ebartex_mfa_trust=stale-token-not-needed-for-issuance; ebartex_pre_auth_token=server-pre-auth',
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
    expect(init.body).toBe(JSON.stringify({
      mfa_code: '123456',
      remember_device: true,
      pre_auth_token: 'server-pre-auth',
    }));
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
    expect(body.authenticated).toBe(true);
    expect(body.access_token).toBeUndefined();
    expect(body.refresh_token).toBeUndefined();
  });

  it.each([
    ['uses the Auth TTL', 3_600, 3_600],
    ['uses the safe fallback when Auth omits TTL', undefined, 300],
    ['clamps an excessive Auth TTL', 172_800, 86_400],
  ] as const)(
    '%s for the access cookie',
    async (_label, expiresIn, expectedMaxAge) => {
      const fetchMock = vi.fn().mockResolvedValue(
        Response.json({
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          ...(expiresIn === undefined ? {} : { expires_in: expiresIn }),
        }),
      );
      vi.stubGlobal('fetch', fetchMock);
      const { POST } = await import('@/app/api/auth/[...path]/route');

      const response = await POST(
        postRequest('/api/auth/login', {
          email: 'test@example.com',
          password: 'correct horse battery staple',
        }),
        { params: Promise.resolve({ path: ['login'] }) },
      );

      const accessCookie = response.headers
        .getSetCookie()
        .find((cookie) => cookie.startsWith('ebartex_access_token=access-token;'));
      expect(accessCookie).toContain(`Max-Age=${expectedMaxAge}`);
    },
  );

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
    expect(body).toMatchObject({ authenticated: true, token_type: 'bearer' });
    expect(body.access_token).toBeUndefined();
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

  it('uses bounded fallback in production without Redis for auth mutations', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AUTH_API_URL', 'https://auth.example.test');
    vi.stubEnv('TRUSTED_UPSTREAM_HOSTS', 'auth.example.test');
    vi.stubEnv('TRUSTED_CLIENT_IP_HEADER', 'cloudfront-viewer-address');
    vi.stubEnv('RATE_LIMIT_REDIS_REST_URL', '');
    vi.stubEnv('RATE_LIMIT_REDIS_REST_TOKEN', '');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    vi.resetModules();

    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fetchMock = vi.fn().mockImplementation(() =>
      new Response(
        JSON.stringify({
          access_token: 'rotated-access',
          refresh_token: 'rotated-refresh',
          token_type: 'bearer',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');
    const productionHeaders = {
      origin: 'https://www.ebartex.com',
      'sec-fetch-site': 'same-origin',
      'cloudfront-viewer-address': '203.0.113.10:43120',
    };

    const loginResponse = await POST(
      postRequest('/api/auth/login', { email: 'user@example.test', password: 'password123' }, productionHeaders),
      { params: Promise.resolve({ path: ['login'] }) },
    );
    expect(loginResponse.status).toBe(200);

    const refreshed = await POST(
      postRequest('/api/auth/refresh', {}, {
        ...productionHeaders,
        cookie: '__Host-ebartex_refresh_token=refresh-token',
      }),
      { params: Promise.resolve({ path: ['refresh'] }) },
    );
    const loggedOut = await POST(
      postRequest('/api/auth/logout', {}, {
        ...productionHeaders,
        cookie: '__Host-ebartex_refresh_token=logout-refresh-token',
      }),
      { params: Promise.resolve({ path: ['logout'] }) },
    );

    expect(refreshed.status).toBe(200);
    expect(loggedOut.status).toBe(200);
    expect(await loggedOut.json()).toEqual({ logged_out: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(warning).toHaveBeenCalledTimes(1);
    warning.mockRestore();
  });

  it.each([
    ['/api/auth/change-password', ['change-password']],
    ['/api/auth/mfa/verify', ['mfa', 'verify']],
    ['/api/auth/mfa/disable', ['mfa', 'disable']],
  ] as const)(
    'clears rotated local auth and trusted-device state after successful %s',
    async (requestPath, path) => {
      const fetchMock = vi.fn().mockResolvedValue(
        Response.json({ completed: true }, { status: 200 }),
      );
      vi.stubGlobal('fetch', fetchMock);
      const { POST } = await import('@/app/api/auth/[...path]/route');

      const response = await POST(
        postRequest(requestPath, {
          password: 'correct horse battery staple',
          current_mfa_code: '123456',
          mfa_code: '123456',
        }),
        { params: Promise.resolve({ path: [...path] }) },
      );

      expect(response.status).toBe(200);
      expect(response.headers.getSetCookie()).toEqual([
        'ebartex_access_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
        'ebartex_refresh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
        'ebartex_pre_auth_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
        '__Host-ebartex_mfa_trust=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
      ]);
    },
  );

  it.each([
    ['/api/auth/mfa/enable', ['mfa', 'enable'], 200],
    ['/api/auth/change-password', ['change-password'], 400],
    ['/api/auth/mfa/verify', ['mfa', 'verify'], 400],
    ['/api/auth/mfa/disable', ['mfa', 'disable'], 401],
  ] as const)(
    'does not clear the local auth session for %s when no rotation succeeds',
    async (requestPath, path, status) => {
      const fetchMock = vi.fn().mockResolvedValue(
        Response.json({ detail: 'unchanged session' }, { status }),
      );
      vi.stubGlobal('fetch', fetchMock);
      const { POST } = await import('@/app/api/auth/[...path]/route');

      const response = await POST(
        postRequest(requestPath, { password: 'correct horse battery staple' }),
        { params: Promise.resolve({ path: [...path] }) },
      );

      expect(response.status).toBe(status);
      expect(response.headers.getSetCookie()).toEqual([]);
    },
  );

  it('logs out locally without a refresh cookie or a functioning rate limiter', async () => {
    const checkRateLimit = vi.fn().mockRejectedValue(new Error('rate limit unavailable'));
    vi.resetModules();
    vi.doMock('@/app/api/_lib/rate-limit', () => ({
      checkRateLimit,
      rateLimitExceededResponse: vi.fn(),
    }));
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');
    vi.doUnmock('@/app/api/_lib/rate-limit');
    const { getAuthCookieName } = await import('@/app/api/_lib/auth-cookies');

    const response = await POST(
      postRequest('/api/auth/logout', {
        refresh_token: 'browser-controlled-token-must-be-ignored',
      }),
      { params: Promise.resolve({ path: ['logout'] }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toMatch(/no-store/);
    expect(await response.json()).toEqual({ logged_out: true });
    expect(checkRateLimit).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();

    const cookies = response.headers.getSetCookie();
    for (const kind of [
      'access',
      'refresh',
      'preauth',
      'password-reset',
      'password-reset-confirm',
    ] as const) {
      expect(
        cookies.some((cookie) =>
          cookie.startsWith(`${getAuthCookieName(kind)}=; Path=/; HttpOnly;`),
        ),
      ).toBe(true);
    }
  });

  it('keeps local logout successful when the revocation rate limiter is unavailable', async () => {
    const checkRateLimit = vi.fn().mockRejectedValue(new Error('rate limit unavailable'));
    vi.resetModules();
    vi.doMock('@/app/api/_lib/rate-limit', () => ({
      checkRateLimit,
      rateLimitExceededResponse: vi.fn(),
    }));
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');
    vi.doUnmock('@/app/api/_lib/rate-limit');

    const response = await POST(
      postRequest('/api/auth/logout', {}, {
        cookie: 'ebartex_refresh_token=valid-http-only-refresh',
      }),
      { params: Promise.resolve({ path: ['logout'] }) },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ logged_out: true });
    expect(response.headers.getSetCookie().length).toBeGreaterThanOrEqual(5);
    expect(checkRateLimit).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns a generic completed logout and clears cookies when auth is offline', async () => {
    const refreshToken = 'refresh-token-never-leak-to-browser-or-logs';
    const fetchMock = vi.fn().mockRejectedValue(new Error('auth offline'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');

    const response = await POST(
      postRequest(
        '/api/auth/logout',
        { refresh_token: 'browser-token-must-be-ignored' },
        { cookie: `ebartex_refresh_token=${refreshToken}` },
      ),
      { params: Promise.resolve({ path: ['logout'] }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toMatch(/no-store/);
    const payload = await response.json();
    expect(payload).toEqual({ logged_out: true });
    expect(JSON.stringify(payload)).not.toContain(refreshToken);
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(refreshToken);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const upstreamInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(upstreamInit.body).toBe(JSON.stringify({ refresh_token: refreshToken }));
    expect(upstreamInit.headers).not.toHaveProperty('Authorization');
    expect(response.headers.getSetCookie().length).toBeGreaterThanOrEqual(5);
    errorSpy.mockRestore();
  });

  it('forwards the cookie access token for revocation but keeps local logout successful on 401', async () => {
    const accessToken = 'expired-access-token';
    const refreshToken = 'valid-http-only-refresh';
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ refresh_token: 'must-not-reach-browser' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');

    const response = await POST(
      postRequest(
        '/api/auth/logout',
        {},
        {
          cookie:
            `ebartex_access_token=${accessToken}; ebartex_refresh_token=${refreshToken}`,
        },
      ),
      { params: Promise.resolve({ path: ['logout'] }) },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ logged_out: true });
    expect(response.headers.getSetCookie().length).toBeGreaterThanOrEqual(5);
    const upstreamInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(upstreamInit.headers).toMatchObject({
      Authorization: `Bearer ${accessToken}`,
    });
    expect(upstreamInit.body).toBe(JSON.stringify({ refresh_token: refreshToken }));
  });

  it('clears both host-only and legacy production cookies without auth configuration', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AUTH_COOKIE_DOMAIN', '.ebartex.com');
    delete process.env.AUTH_API_URL;
    vi.resetModules();
    vi.doMock('@/lib/server-runtime-env', () => ({
      getAuthApiUrlEnv: () => '',
      getAuthInternalIdentityEnv: () => ({ caller: '', token: '' }),
    }));
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');
    vi.doUnmock('@/lib/server-runtime-env');

    const response = await POST(
      postRequest('/api/auth/logout', {}, {
        origin: 'https://www.ebartex.com',
        'sec-fetch-site': 'same-origin',
      }),
      { params: Promise.resolve({ path: ['logout'] }) },
    );

    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
    const cookies = response.headers.getSetCookie().join('\n');
    expect(cookies).toContain('__Host-ebartex_access_token=;');
    expect(cookies).toContain('__Host-ebartex_refresh_token=;');
    expect(cookies).toContain('__Host-ebartex_pre_auth_token=;');
    expect(cookies).toContain('__Host-ebartex_password_reset_token=;');
    expect(cookies).toContain('__Host-ebartex_password_reset_confirm_token=;');
    expect(cookies).toContain('ebartex_access_token=;');
    expect(cookies).toContain('ebartex_refresh_token=;');
    expect(cookies).toContain('ebartex_pre_auth_token=;');
    expect(cookies).toContain('Domain=.ebartex.com');
  });

  it('keeps cross-site logout requests blocked before clearing cookies', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');

    const response = await POST(
      postRequest('/api/auth/logout', {}, {
        origin: 'https://attacker.example',
        'sec-fetch-site': 'cross-site',
      }),
      { params: Promise.resolve({ path: ['logout'] }) },
    );

    expect(response.status).toBe(403);
    expect(response.headers.getSetCookie()).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never creates cookies from token-shaped fields in an upstream error', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          detail: 'Invalid request',
          access_token: 'attacker-controlled-access',
          refresh_token: 'attacker-controlled-refresh',
          pre_auth_token: 'attacker-controlled-preauth',
        }),
        { status: 422, headers: { 'content-type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');

    const response = await POST(
      postRequest('/api/auth/login', {
        email: 'test@example.com',
        password: 'not-the-password',
      }),
      { params: Promise.resolve({ path: ['login'] }) },
    );

    expect(response.status).toBe(422);
    const cookies = response.headers.getSetCookie().join('\n');
    expect(cookies).not.toContain('attacker-controlled');
    const payload = await response.json();
    expect(payload.access_token).toBeUndefined();
    expect(payload.refresh_token).toBeUndefined();
    expect(payload.pre_auth_token).toBeUndefined();
  });

  it('keeps both password-reset JWT hand-offs in rotating HttpOnly cookies', async () => {
    const resetToken = `reset.${'a'.repeat(48)}`;
    const confirmToken = `confirm.${'b'.repeat(48)}`;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            token: resetToken,
            token_type: 'password_reset',
            expires_in_seconds: 300,
            access_token: 'must-not-create-a-session',
            refresh_token: 'must-not-create-a-refresh-session',
            pre_auth_token: 'must-not-create-an-mfa-session',
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            token: confirmToken,
            token_type: 'password_reset_confirm',
            expires_in_seconds: 300,
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ detail: 'Invalid credentials', token: 'must-not-leak' }),
          { status: 401, headers: { 'content-type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Password updated' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');
    const { getAuthCookieName } = await import('@/app/api/_lib/auth-cookies');
    const resetCookieName = getAuthCookieName('password-reset');
    const confirmCookieName = getAuthCookieName('password-reset-confirm');

    const verifyResponse = await POST(
      postRequest('/api/auth/password/reset/verify-code', {
        email: 'test@example.com',
        code: 'abcd1234',
      }),
      { params: Promise.resolve({ path: ['password', 'reset', 'verify-code'] }) },
    );
    expect(await verifyResponse.json()).toEqual({
      handoff_ready: true,
      expires_in_seconds: 300,
    });
    expect(
      verifyResponse.headers
        .getSetCookie()
        .some((cookie) =>
          cookie.startsWith(`${resetCookieName}=${resetToken}; Path=/; HttpOnly;`),
        ),
    ).toBe(true);
    const verifyCookies = verifyResponse.headers.getSetCookie().join('\n');
    expect(verifyCookies).toContain('HttpOnly; SameSite=Lax; Max-Age=300');
    expect(verifyCookies).not.toContain('Domain=');
    expect(verifyCookies).not.toContain('ebartex_access_token=must-not');
    expect(verifyCookies).not.toContain('ebartex_refresh_token=must-not');
    expect(verifyCookies).not.toContain('ebartex_pre_auth_token=must-not');

    const initResponse = await POST(
      postRequest(
        '/api/auth/password/reset/confirm-init',
        {
          reset_token: `attacker.${'x'.repeat(48)}`,
          confirm_token: `attacker.${'y'.repeat(48)}`,
          new_password: 'A-new-password-123',
          unrelated: 'drop-me',
        },
        { cookie: `${resetCookieName}=${resetToken}` },
      ),
      { params: Promise.resolve({ path: ['password', 'reset', 'confirm-init'] }) },
    );
    expect((fetchMock.mock.calls[1]?.[1] as RequestInit).body).toBe(
      JSON.stringify({
        reset_token: resetToken,
        new_password: 'A-new-password-123',
      }),
    );
    expect(await initResponse.json()).toEqual({
      handoff_ready: true,
      expires_in_seconds: 300,
    });
    const initCookies = initResponse.headers.getSetCookie();
    expect(
      initCookies.some((cookie) =>
        cookie.startsWith(`${confirmCookieName}=${confirmToken}; Path=/; HttpOnly;`),
      ),
    ).toBe(true);
    expect(
      initCookies.some((cookie) =>
        cookie.startsWith(`${resetCookieName}=; Path=/; HttpOnly;`),
      ),
    ).toBe(true);

    const firstFinalResponse = await POST(
      postRequest(
        '/api/auth/password/reset/confirm-final',
        { confirm_token: `attacker.${'z'.repeat(48)}`, code: '123456' },
        { cookie: `${confirmCookieName}=${confirmToken}` },
      ),
      { params: Promise.resolve({ path: ['password', 'reset', 'confirm-final'] }) },
    );
    expect(firstFinalResponse.status).toBe(401);
    expect((fetchMock.mock.calls[2]?.[1] as RequestInit).body).toBe(
      JSON.stringify({ confirm_token: confirmToken, code: '123456' }),
    );
    expect(JSON.stringify(await firstFinalResponse.json())).not.toContain('must-not-leak');
    expect(
      firstFinalResponse.headers
        .getSetCookie()
        .some((cookie) => cookie.startsWith(`${confirmCookieName}=;`)),
    ).toBe(false);

    const successfulFinalResponse = await POST(
      postRequest(
        '/api/auth/password/reset/confirm-final',
        { code: '654321' },
        { cookie: `${confirmCookieName}=${confirmToken}` },
      ),
      { params: Promise.resolve({ path: ['password', 'reset', 'confirm-final'] }) },
    );
    expect(successfulFinalResponse.status).toBe(200);
    expect(
      successfulFinalResponse.headers
        .getSetCookie()
        .some((cookie) => cookie.startsWith(`${confirmCookieName}=; Path=/; HttpOnly;`)),
    ).toBe(true);
  });

  it('rejects browser-supplied reset tokens and clears both cookies locally', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');
    const { getAuthCookieName } = await import('@/app/api/_lib/auth-cookies');

    const rejected = await POST(
      postRequest('/api/auth/password/reset/confirm-init', {
        reset_token: `attacker.${'x'.repeat(48)}`,
        new_password: 'A-new-password-123',
      }),
      { params: Promise.resolve({ path: ['password', 'reset', 'confirm-init'] }) },
    );
    expect(rejected.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();

    const cleared = await POST(
      postRequest('/api/auth/password/reset/clear-session', {}),
      { params: Promise.resolve({ path: ['password', 'reset', 'clear-session'] }) },
    );
    expect(cleared.status).toBe(200);
    expect(await cleared.json()).toEqual({ cleared: true });
    const cookies = cleared.headers.getSetCookie();
    expect(
      cookies.some((cookie) =>
        cookie.startsWith(`${getAuthCookieName('password-reset')}=; Path=/; HttpOnly;`),
      ),
    ).toBe(true);
    expect(
      cookies.some((cookie) =>
        cookie.startsWith(
          `${getAuthCookieName('password-reset-confirm')}=; Path=/; HttpOnly;`,
        ),
      ),
    ).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['/api/auth/password/reset', ['password', 'reset']],
    ['/api/auth/password/reset/confirm', ['password', 'reset', 'confirm']],
  ] as const)('keeps the legacy single-OTP reset route closed: %s', async (url, path) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');

    const response = await POST(
      postRequest(url, {
        email: 'test@example.com',
        code: '123456',
        new_password: 'A-new-password-123',
      }),
      { params: Promise.resolve({ path: [...path] }) },
    );

    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toMatch(/no-store/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('marks missing auth service configuration as no-store', async () => {
    delete process.env.AUTH_API_URL;
    vi.resetModules();
    vi.doMock('@/lib/server-runtime-env', () => ({
      getAuthApiUrlEnv: () => '',
      getAuthInternalIdentityEnv: () => ({ caller: '', token: '' }),
    }));
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');
    vi.doUnmock('@/lib/server-runtime-env');

    const response = await POST(
      postRequest('/api/auth/login', {
        email: 'test@example.com',
        password: 'not-logged',
      }),
      { params: Promise.resolve({ path: ['login'] }) },
    );

    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toMatch(/no-store/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('redacts dynamic auth paths from upstream failure logs', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('upstream failed'));
    vi.stubGlobal('fetch', fetchMock);
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { GET } = await import('@/app/api/auth/[...path]/route');
    const request = new NextRequest('http://localhost:3000/api/auth/users/alice');

    const response = await GET(request, {
      params: Promise.resolve({ path: ['users', 'alice'] }),
    });

    expect(response.status).toBe(502);
    expect(response.headers.get('cache-control')).toMatch(/no-store/);
    expect(JSON.stringify(logSpy.mock.calls)).not.toContain('alice');
    expect(JSON.stringify(logSpy.mock.calls)).not.toContain('upstream failed');
    logSpy.mockRestore();
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
      'http://localhost:3000/api/auth/users/public?ids=0198f65d-88e7-7f38-9c71-6b28ea26eb9d'
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

  it('returns 408 and never contacts auth when the request body stalls', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/auth/[...path]/route');
    const stream = new ReadableStream<Uint8Array>({ pull() {} });
    const request = new NextRequest(
      new Request('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: stream,
        duplex: 'half',
      } as RequestInit & { duplex: 'half' }),
    );

    const pending = POST(request, {
      params: Promise.resolve({ path: ['login'] }),
    });
    await vi.advanceTimersByTimeAsync(10_001);
    const response = await pending;
    vi.useRealTimers();

    expect(response.status).toBe(408);
    expect(response.headers.get('cache-control')).toMatch(/no-store/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('propagates trusted-device deletion and caps pre-auth at five minutes', async () => {
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

    const cookies = response.headers.getSetCookie();
    expect(cookies).toContain(
      'ebartex_pre_auth_token=pre-auth; Path=/; HttpOnly; SameSite=Lax; Max-Age=300'
    );
    expect(cookies.join('\n')).not.toContain('Max-Age=600');
    expect(cookies).toContain(
      '__Host-ebartex_mfa_trust=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
    );
  });
});
