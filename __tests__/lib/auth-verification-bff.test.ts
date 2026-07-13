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
});
