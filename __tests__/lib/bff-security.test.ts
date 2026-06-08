/**
 * BFF Security Tests
 *
 * Coprono i requisiti di accettazione del piano di sicurezza:
 * - Accesso anonimo a route private → 401 fail-closed
 * - Cookie invalido/assente → 401
 * - Tutti i proxy privati usano Cache-Control: no-store
 * - GET pubblici marketplace → Cache-Control: public, s-maxage=30
 * - Rate limit → 429 con Retry-After
 * - Timeout backend → 504
 * - Log privi di token/PII (verificato indirettamente)
 *
 * Pattern: mock globale di fetch, costruzione manuale di NextRequest,
 * chiamata diretta al route handler esportato.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── helpers ────────────────────────────────────────────────────────────────

function makeRequest(
  path: string,
  {
    method = 'GET',
    cookie,
    body,
  }: { method?: string; cookie?: string; body?: string } = {}
): NextRequest {
  const url = `http://localhost:3000${path}`;
  const init: RequestInit & { headers?: Record<string, string> } = { method };
  const headers: Record<string, string> = {};
  if (cookie) headers['cookie'] = cookie;
  if (body) {
    headers['content-type'] = 'application/json';
    init.body = body;
  }
  init.headers = headers;
  return new NextRequest(url, init);
}

/** Cookie HttpOnly valido (access token fittizio, non verificato lato BFF).
 *  In sviluppo il cookie name è 'ebartex_access_token' (senza __Host-). */
const VALID_COOKIE = 'ebartex_access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsImV4cCI6OTk5OTk5OTk5OX0.sig';
/** Cookie invalido (valore vuoto) */
const INVALID_COOKIE = 'ebartex_access_token=';

// ─── env setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  // Usiamo 'development' così:
  // 1. lib/config.ts non lancia per NEXT_PUBLIC_AUTH_API_URL mancante
  // 2. Il cookie name non usa il prefisso __Host- (richiede HTTPS)
  process.env.NODE_ENV = 'development';
  process.env.NEXT_PUBLIC_AUTH_API_URL = 'http://auth-api.test';
  process.env.AUCTION_API_URL = 'http://auction-api.test';
  process.env.MARKETPLACE_API_URL = 'http://marketplace-api.test';
  process.env.SYNC_API_URL = 'http://sync-api.test';
  // Default fetch mock: sovrascritta nei test che simulano risposta backend
  global.fetch = vi.fn().mockRejectedValue(new Error('fetch not stubbed in this test')) as typeof fetch;
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.NODE_ENV;
  delete process.env.NEXT_PUBLIC_AUTH_API_URL;
  delete process.env.AUCTION_API_URL;
  delete process.env.MARKETPLACE_API_URL;
  delete process.env.SYNC_API_URL;
});

// ─── /api/orders ─────────────────────────────────────────────────────────────

describe('/api/orders — sicurezza', () => {
  it('risponde 401 se nessun cookie', async () => {
    const { GET } = await import('@/app/api/orders/[...path]/route');
    const req = makeRequest('/api/orders/123');
    const ctx = { params: Promise.resolve({ path: ['123'] }) };
    const res = await GET(req, ctx);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.detail).toBeTruthy();
  });

  it('risponde 401 se cookie vuoto', async () => {
    const { GET } = await import('@/app/api/orders/[...path]/route');
    const req = makeRequest('/api/orders/123', { cookie: INVALID_COOKIE });
    const ctx = { params: Promise.resolve({ path: ['123'] }) };
    const res = await GET(req, ctx);
    expect(res.status).toBe(401);
  });

  it('header Cache-Control no-store in risposta 401', async () => {
    const { GET } = await import('@/app/api/orders/[...path]/route');
    const req = makeRequest('/api/orders/123');
    const ctx = { params: Promise.resolve({ path: ['123'] }) };
    const res = await GET(req, ctx);
    expect(res.headers.get('cache-control')).toMatch(/no-store/);
  });

  it('passa al backend con cookie valido e risponde 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ id: '123', status: 'paid' }),
    }));
    const { GET } = await import('@/app/api/orders/[...path]/route');
    const req = makeRequest('/api/orders/123', { cookie: VALID_COOKIE });
    const ctx = { params: Promise.resolve({ path: ['123'] }) };
    const res = await GET(req, ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toMatch(/no-store/);
  });

  it('risponde 504 su timeout backend', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      const err = new Error('aborted');
      err.name = 'AbortError';
      return Promise.reject(err);
    }));
    const { GET } = await import('@/app/api/orders/[...path]/route');
    const req = makeRequest('/api/orders/123', { cookie: VALID_COOKIE });
    const ctx = { params: Promise.resolve({ path: ['123'] }) };
    const res = await GET(req, ctx);
    expect(res.status).toBe(504);
  });
});

// ─── /api/disputes ───────────────────────────────────────────────────────────

describe('/api/disputes — sicurezza', () => {
  it('risponde 401 se nessun cookie', async () => {
    const { GET } = await import('@/app/api/disputes/route');
    const req = makeRequest('/api/disputes');
    const res = await GET(req);
    expect(res.status).toBe(401);
    expect(res.headers.get('cache-control')).toMatch(/no-store/);
  });

  it('passa al backend con cookie valido', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      json: () => Promise.resolve([]),
    }));
    const { GET } = await import('@/app/api/disputes/route');
    const req = makeRequest('/api/disputes', { cookie: VALID_COOKIE });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toMatch(/no-store/);
  });

  it('subpath: 401 senza cookie', async () => {
    const { GET } = await import('@/app/api/disputes/[...path]/route');
    const req = makeRequest('/api/disputes/abc/resolve');
    const ctx = { params: Promise.resolve({ path: ['abc', 'resolve'] }) };
    const res = await GET(req, ctx);
    expect(res.status).toBe(401);
  });
});

// ─── /api/notifications ──────────────────────────────────────────────────────

describe('/api/notifications — sicurezza', () => {
  it('risponde 401 se nessun cookie', async () => {
    const { GET } = await import('@/app/api/notifications/route');
    const req = makeRequest('/api/notifications');
    const res = await GET(req);
    expect(res.status).toBe(401);
    expect(res.headers.get('cache-control')).toMatch(/no-store/);
  });

  it('passa al backend con cookie valido', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ items: [] }),
    }));
    const { GET } = await import('@/app/api/notifications/route');
    const req = makeRequest('/api/notifications', { cookie: VALID_COOKIE });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toMatch(/no-store/);
  });
});

// ─── /api/saved-auctions ─────────────────────────────────────────────────────

describe('/api/saved-auctions — sicurezza', () => {
  it('risponde 401 se nessun cookie', async () => {
    const { GET } = await import('@/app/api/saved-auctions/[...path]/route');
    const req = makeRequest('/api/saved-auctions/list');
    const ctx = { params: Promise.resolve({ path: ['list'] }) };
    const res = await GET(req, ctx);
    expect(res.status).toBe(401);
    expect(res.headers.get('cache-control')).toMatch(/no-store/);
  });

  it('passa al backend con cookie valido', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      json: () => Promise.resolve([]),
    }));
    const { GET } = await import('@/app/api/saved-auctions/[...path]/route');
    const req = makeRequest('/api/saved-auctions/list', { cookie: VALID_COOKIE });
    const ctx = { params: Promise.resolve({ path: ['list'] }) };
    const res = await GET(req, ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toMatch(/no-store/);
  });
});

// ─── /api/auctions ───────────────────────────────────────────────────────────

describe('/api/auctions — sicurezza', () => {
  it('root: risponde 401 senza cookie', async () => {
    const { GET } = await import('@/app/api/auctions/route');
    const req = makeRequest('/api/auctions');
    const res = await GET(req);
    expect(res.status).toBe(401);
    expect(res.headers.get('cache-control')).toMatch(/no-store/);
  });

  it('subpath: risponde 401 senza cookie', async () => {
    const { GET } = await import('@/app/api/auctions/[...path]/route');
    const req = makeRequest('/api/auctions/abc123');
    const ctx = { params: Promise.resolve({ path: ['abc123'] }) };
    const res = await GET(req, ctx);
    expect(res.status).toBe(401);
  });

  it('subpath: risponde 200 con cookie valido', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ id: 'abc123' }),
    }));
    const { GET } = await import('@/app/api/auctions/[...path]/route');
    const req = makeRequest('/api/auctions/abc123', { cookie: VALID_COOKIE });
    const ctx = { params: Promise.resolve({ path: ['abc123'] }) };
    const res = await GET(req, ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toMatch(/no-store/);
  });
});

// ─── /api/sync ───────────────────────────────────────────────────────────────

describe('/api/sync — sicurezza', () => {
  it('risponde 401 senza cookie', async () => {
    const { GET } = await import('@/app/api/sync/[...path]/route');
    const req = makeRequest('/api/sync/status');
    const ctx = { params: Promise.resolve({ path: ['status'] }) };
    const res = await GET(req, ctx);
    expect(res.status).toBe(401);
    expect(res.headers.get('cache-control')).toMatch(/no-store/);
  });

  it('risponde 504 su timeout', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      const err = new Error('aborted');
      err.name = 'AbortError';
      return Promise.reject(err);
    }));
    const { GET } = await import('@/app/api/sync/[...path]/route');
    const req = makeRequest('/api/sync/status', { cookie: VALID_COOKIE });
    const ctx = { params: Promise.resolve({ path: ['status'] }) };
    const res = await GET(req, ctx);
    expect(res.status).toBe(504);
  });
});

// ─── /api/marketplace ────────────────────────────────────────────────────────

describe('/api/marketplace — cache pubblica e sicurezza privata', () => {
  it('listings/public/* → 200 con cache pubblica s-maxage=30', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ items: [] }),
    }) as typeof fetch;
    const { GET } = await import('@/app/api/marketplace/[...path]/route');
    const req = makeRequest('/api/marketplace/listings/public/cards');
    const ctx = { params: Promise.resolve({ path: ['listings', 'public', 'cards'] }) };
    const res = await GET(req, ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toMatch(/public/);
    expect(res.headers.get('cache-control')).toMatch(/s-maxage/);
  });

  it('route privata senza cookie → 401', async () => {
    const { GET } = await import('@/app/api/marketplace/[...path]/route');
    const req = makeRequest('/api/marketplace/my-listings');
    const ctx = { params: Promise.resolve({ path: ['my-listings'] }) };
    const res = await GET(req, ctx);
    expect(res.status).toBe(401);
  });

  it('route privata con cookie valido → no-store', async () => {
    // resetModules per evitare che il modulo in cache usi il fetch precedente
    vi.resetModules();
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      json: () => Promise.resolve([]),
    }) as typeof fetch;
    const { GET } = await import('@/app/api/marketplace/[...path]/route');
    const req = makeRequest('/api/marketplace/my-listings', { cookie: VALID_COOKIE });
    const ctx = { params: Promise.resolve({ path: ['my-listings'] }) };
    const res = await GET(req, ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toMatch(/no-store/);
  });
});

// ─── Rate Limiting ────────────────────────────────────────────────────────────

describe('Rate limiting — checkRateLimit + rateLimitExceededResponse', () => {
  it('rateLimitExceededResponse restituisce 429 con Retry-After e no-store', async () => {
    const { rateLimitExceededResponse } = await import('@/app/api/_lib/rate-limit');
    const result = { allowed: false, limit: 60, remaining: 0, retryAfterSec: 30 };
    const res = rateLimitExceededResponse(result);
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBe('30');
    expect(res.headers.get('cache-control')).toMatch(/no-store/);
    expect(res.headers.get('x-ratelimit-limit')).toBe('60');
    expect(res.headers.get('x-ratelimit-remaining')).toBe('0');
  });

  it('checkRateLimit ritorna allowed:true entro la finestra', async () => {
    const { checkRateLimit } = await import('@/app/api/_lib/rate-limit');
    const req = makeRequest('/api/orders/list', { cookie: VALID_COOKIE });
    const result = checkRateLimit(req, { scope: 'test-scope-unique', limit: 5, windowMs: 60_000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('checkRateLimit ritorna allowed:false dopo aver esaurito la finestra', async () => {
    const { checkRateLimit } = await import('@/app/api/_lib/rate-limit');
    const req = makeRequest('/api/orders/list', { cookie: VALID_COOKIE });
    const scope = `test-exhausted-${Date.now()}`;
    // Consuma tutti i token
    for (let i = 0; i < 3; i++) checkRateLimit(req, { scope, limit: 3, windowMs: 60_000 });
    // La quarta deve fallire
    const result = checkRateLimit(req, { scope, limit: 3, windowMs: 60_000 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSec).toBeGreaterThan(0);
  });
});

// ─── Assenza di token/PII nei log ────────────────────────────────────────────

describe('Log — nessun dato sensibile', () => {
  it('un errore di fetch non logga il token nel messaggio', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connection refused')));

    const { GET } = await import('@/app/api/orders/[...path]/route');
    const req = makeRequest('/api/orders/123', { cookie: VALID_COOKIE });
    const ctx = { params: Promise.resolve({ path: ['123'] }) };
    await GET(req, ctx);

    // Verifica che nessun argomento del console.error contenga il token
    for (const call of consoleSpy.mock.calls) {
      for (const arg of call) {
        const s = typeof arg === 'string' ? arg : JSON.stringify(arg);
        expect(s).not.toMatch(/eyJ/); // prefisso JWT base64
        expect(s).not.toMatch(/Bearer/);
      }
    }
  });
});
