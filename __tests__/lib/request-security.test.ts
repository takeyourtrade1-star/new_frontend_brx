import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { enforceSameOrigin } from '@/app/api/_lib/request-security';
import { enforceScannerBrowserFetch } from '@/app/api/scanner/_request-security';

describe('production same-origin boundary', () => {
  afterEach(() => vi.unstubAllEnvs());

  function request(headers: HeadersInit): NextRequest {
    return new NextRequest('https://evil.example/api/auth/login', {
      method: 'POST',
      headers,
    });
  }

  it('non considera Host, X-Forwarded-Host o URL della richiesta come origine fidata', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('APP_ORIGIN', 'https://www.ebartex.com');
    expect(
      enforceSameOrigin(
        request({
          origin: 'https://evil.example',
          host: 'evil.example',
          'x-forwarded-host': 'www.ebartex.com',
        }),
      )?.status,
    ).toBe(403);
    expect(
      enforceSameOrigin(request({ origin: 'https://www.ebartex.com' })),
    ).toBeNull();
  });

  it('usa il fallback canonico e accetta solo i due origin production esatti', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('APP_ORIGIN', '');
    expect(
      enforceSameOrigin(request({ origin: 'https://www.ebartex.com' })),
    ).toBeNull();
    expect(
      enforceSameOrigin(
        request({ origin: 'https://main.d8ry9s45st8bf.amplifyapp.com' }),
      ),
    ).toBeNull();
    expect(
      enforceSameOrigin(request({ origin: 'https://preview.d8ry9s45st8bf.amplifyapp.com' }))
        ?.status,
    ).toBe(403);
    expect(enforceSameOrigin(request({ 'sec-fetch-site': 'same-origin' }))).toBeNull();
  });

  it('fallisce chiuso senza segnali browser o con APP_ORIGIN esplicitamente invalido', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('APP_ORIGIN', 'https://www.ebartex.com');
    expect(enforceSameOrigin(request({}))?.status).toBe(403);
    expect(enforceSameOrigin(request({ 'sec-fetch-site': 'same-origin' }))).toBeNull();

    vi.stubEnv('APP_ORIGIN', 'https://attacker.example');
    expect(enforceSameOrigin(request({ origin: 'https://www.ebartex.com' }))?.status).toBe(403);
    expect(enforceSameOrigin(request({ 'sec-fetch-site': 'same-origin' }))?.status).toBe(403);
  });

  it('applica lo stesso resolver production ai download scanner', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('APP_ORIGIN', '');
    const scannerRequest = (origin?: string) =>
      new NextRequest('https://attacker.example/api/scanner/static/model.onnx', {
        headers: {
          'x-scanner-request': '1',
          'sec-fetch-site': 'same-origin',
          'sec-fetch-dest': 'empty',
          host: 'attacker.example',
          'x-forwarded-host': 'attacker.example',
          ...(origin ? { origin } : {}),
        },
      });

    expect(enforceScannerBrowserFetch(scannerRequest('https://www.ebartex.com'))).toBeNull();
    expect(
      enforceScannerBrowserFetch(
        scannerRequest('https://main.d8ry9s45st8bf.amplifyapp.com'),
      ),
    ).toBeNull();
    expect(enforceScannerBrowserFetch(scannerRequest('https://attacker.example'))?.status).toBe(403);

    vi.stubEnv('APP_ORIGIN', 'https://attacker.example');
    expect(enforceScannerBrowserFetch(scannerRequest())?.status).toBe(403);
  });
});
