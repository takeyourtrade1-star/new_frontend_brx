import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { enforceSameOrigin } from '@/app/api/_lib/request-security';

describe('production same-origin boundary', () => {
  afterEach(() => vi.unstubAllEnvs());

  function request(headers: HeadersInit): NextRequest {
    return new NextRequest('https://evil.example/api/auth/login', {
      method: 'POST',
      headers,
    });
  }

  it('non considera Host o URL della richiesta come origine fidata', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('APP_ORIGIN', 'https://www.ebartex.com');
    expect(
      enforceSameOrigin(
        request({ origin: 'https://evil.example', host: 'evil.example' }),
      )?.status,
    ).toBe(403);
    expect(
      enforceSameOrigin(request({ origin: 'https://www.ebartex.com' })),
    ).toBeNull();
  });

  it('fallisce chiuso senza APP_ORIGIN o segnali browser same-origin', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('APP_ORIGIN', '');
    expect(enforceSameOrigin(request({ 'sec-fetch-site': 'same-origin' }))?.status).toBe(403);

    vi.stubEnv('APP_ORIGIN', 'https://www.ebartex.com');
    expect(enforceSameOrigin(request({}))?.status).toBe(403);
    expect(enforceSameOrigin(request({ 'sec-fetch-site': 'same-origin' }))).toBeNull();
  });
});
