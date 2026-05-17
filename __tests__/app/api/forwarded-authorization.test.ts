import type { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { getForwardedAuthorization } from '@/app/api/_lib/forwarded-authorization';

function requestWithAuth({
  cookieToken,
  authorization,
}: {
  cookieToken?: string;
  authorization?: string | null;
}): NextRequest {
  return {
    cookies: {
      get: (name: string) =>
        name === 'ebartex_access_token' && cookieToken !== undefined
          ? { value: cookieToken }
          : undefined,
    },
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'authorization' ? authorization ?? null : null,
    },
  } as unknown as NextRequest;
}

describe('getForwardedAuthorization', () => {
  it('prefers the HttpOnly access-token cookie over a stale Authorization header', () => {
    const request = requestWithAuth({
      cookieToken: 'fresh-token',
      authorization: 'Bearer stale-token',
    });

    expect(getForwardedAuthorization(request)).toBe('Bearer fresh-token');
  });

  it('decodes and trims the cookie token before forwarding it as bearer auth', () => {
    const request = requestWithAuth({
      cookieToken: encodeURIComponent('  refreshed token  '),
    });

    expect(getForwardedAuthorization(request)).toBe('Bearer refreshed token');
  });

  it('ignores an empty bearer header when no cookie token exists', () => {
    const request = requestWithAuth({ authorization: 'Bearer   ' });

    expect(getForwardedAuthorization(request)).toBeUndefined();
  });

  it('falls back to a non-empty Authorization header when no cookie token exists', () => {
    const request = requestWithAuth({ authorization: 'Bearer header-token' });

    expect(getForwardedAuthorization(request)).toBe('Bearer header-token');
  });
});
