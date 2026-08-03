import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { buildContentSecurityPolicy, middleware } from '@/middleware';

describe('middleware CSP', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('non permette script inline generici e applica le direttive di isolamento', () => {
    const csp = buildContentSecurityPolicy('abc123');

    expect(csp).toContain(
      "script-src 'self' 'nonce-abc123' 'strict-dynamic' 'wasm-unsafe-eval'"
    );
    expect(csp).toContain("script-src-attr 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-src 'none'");
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toContain('fonts.googleapis.com');
    expect(csp).not.toContain('fonts.gstatic.com');
    const connectDirective = csp.split('; ').find((value) => value.startsWith('connect-src'));
    expect(connectDirective).not.toContain('https://*.ebartex.com');
    expect(csp).toContain('wss://auction.ebartex.com');
    expect(csp).not.toContain('wss://*.ebartex.com');
  });

  it('sostituisce un nonce client-controlled e ne genera uno diverso per richiesta', () => {
    const first = middleware(
      new NextRequest('https://ebartex.com/products/test', {
        headers: { 'x-nonce': 'attacker-controlled' },
      })
    );
    const second = middleware(new NextRequest('https://ebartex.com/products/test'));

    const firstCsp = first.headers.get('content-security-policy');
    const secondCsp = second.headers.get('content-security-policy');
    expect(firstCsp).toMatch(/'nonce-[a-f0-9]{32}'/);
    expect(firstCsp).not.toContain('attacker-controlled');
    expect(secondCsp).toMatch(/'nonce-[a-f0-9]{32}'/);
    expect(secondCsp).not.toBe(firstCsp);
  });

  it('protegge con la stessa CSP anche i redirect verso il login', () => {
    const response = middleware(new NextRequest('https://ebartex.com/account/profilo'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://ebartex.com/login?accesso=1&redirect=%2Faccount%2Fprofilo'
    );
    expect(response.headers.get('content-security-policy')).toMatch(
      /script-src 'self' 'nonce-[a-f0-9]{32}' 'strict-dynamic' 'wasm-unsafe-eval'/
    );
    expect(response.headers.get('cache-control')).toBe('private, no-store, max-age=0');
  });

  it('costruisce redirect production solo da APP_ORIGIN, non da Host ostile', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('APP_ORIGIN', 'https://www.ebartex.com');
    const response = middleware(
      new NextRequest('https://attacker.example/account/profilo', {
        headers: {
          host: 'attacker.example',
          'x-forwarded-host': 'attacker.example',
        },
      }),
    );

    expect(response.headers.get('location')).toBe(
      'https://www.ebartex.com/login?accesso=1&redirect=%2Faccount%2Fprofilo',
    );
  });

  it('usa il dominio canonico se APP_ORIGIN è assente senza fidarsi degli header', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('APP_ORIGIN', '');
    const response = middleware(
      new NextRequest('https://attacker.example/account/profilo', {
        headers: {
          host: 'attacker.example',
          'x-forwarded-host': 'attacker.example',
        },
      }),
    );

    expect(response.headers.get('location')).toBe(
      'https://www.ebartex.com/login?accesso=1&redirect=%2Faccount%2Fprofilo',
    );
  });

  it('fallisce chiuso in production se APP_ORIGIN non è valido', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('APP_ORIGIN', 'https://attacker.example');
    const response = middleware(new NextRequest('https://attacker.example/account'));
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('private, no-store, max-age=0');
  });

  it('impedisce cache browser/CDN su pagine protette e login', () => {
    const authenticated = middleware(
      new NextRequest('https://ebartex.com/account', {
        headers: { cookie: 'ebartex_access_token=opaque' },
      }),
    );
    const login = middleware(new NextRequest('https://ebartex.com/login'));
    expect(authenticated.headers.get('cache-control')).toBe('private, no-store, max-age=0');
    expect(login.headers.get('cache-control')).toBe('private, no-store, max-age=0');
  });
});
