// @vitest-environment node
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
    headers: extraHeaders,
  }: {
    method?: string;
    cookie?: string;
    body?: string;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const url = new URL(`http://localhost:3000${path}`);
  const headers: Record<string, string> = { ...(extraHeaders || {}) };
  if (cookie) headers['cookie'] = cookie;
  if (body) {
    headers['content-type'] = 'application/json';
  }
  const init = { method, headers } as Record<string, unknown>;
  if (body) {
    init.body = body;
  }
  return new NextRequest(url, init as unknown as ConstructorParameters<typeof NextRequest>[1]);
}

/** Cookie HttpOnly valido (access token fittizio, non verificato lato BFF).
 *  In sviluppo il cookie name è 'ebartex_access_token' (senza __Host-). */
const VALID_COOKIE = 'ebartex_access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsImV4cCI6OTk5OTk5OTk5OX0.sig';
const VALID_REFRESH_COOKIE = 'ebartex_refresh_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsImV4cCI6OTk5OTk5OTk5OX0.sig';
/** Cookie invalido (valore vuoto) */
const INVALID_COOKIE = 'ebartex_access_token=';

const VALID_PAIRING_SESSION_ID = '12345678-1234-4234-8234-123456789abc';
const VALID_PAIRING_TOKEN = 'abcdefghijklmnopqrstuvwxyz123456';

// ─── env setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  // Usiamo 'development' così:
  // 1. lib/config.ts non lancia per NEXT_PUBLIC_AUTH_API_URL mancante
  // 2. Il cookie name non usa il prefisso __Host- (richiede HTTPS)
  (process.env as Record<string, string>).NODE_ENV = 'development';
  process.env.NEXT_PUBLIC_AUTH_API_URL = 'http://auth-api.test';
  process.env.AUCTION_API_URL = 'http://auction-api.test';
  process.env.MARKETPLACE_API_URL = 'http://marketplace-api.test';
  process.env.SYNC_API_URL = 'http://sync-api.test';
  // Default fetch mock: sovrascritta nei test che simulano risposta backend
  vi.stubGlobal(
    'fetch',
    vi.fn().mockRejectedValue(new Error('fetch not stubbed in this test'))
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (process.env as Record<string, string | undefined>).NODE_ENV;
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
      ok: true,
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
      ok: true,
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
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { GET } = await import('@/app/api/notifications/route');
    const req = makeRequest('/api/notifications', { cookie: VALID_COOKIE });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toMatch(/no-store/);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://auction-api.test/notifications',
      expect.objectContaining({ method: 'GET' }),
    );
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
      ok: true,
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
  it('root GET pubblico senza cookie passa al backend e risponde 200 se il backend è raggiungibile', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    }));
    const { GET } = await import('@/app/api/auctions/route');
    const req = makeRequest('/api/auctions');
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toMatch(/no-store/);
  });

  it('subpath GET pubblico senza cookie passa al backend e risponde 200 se il backend è raggiungibile', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ id: 'abc123' }),
    }));
    const { GET } = await import('@/app/api/auctions/[...path]/route');
    const req = makeRequest('/api/auctions/abc123');
    const ctx = { params: Promise.resolve({ path: ['abc123'] }) };
    const res = await GET(req, ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toMatch(/no-store/);
  });

  it('root POST senza cookie → 401', async () => {
    const { POST } = await import('@/app/api/auctions/route');
    const req = makeRequest('/api/auctions', { method: 'POST', body: '{}' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('subpath POST senza cookie → 401', async () => {
    const { POST } = await import('@/app/api/auctions/[...path]/route');
    const req = makeRequest('/api/auctions/abc123/bid', { method: 'POST', body: '{}' });
    const ctx = { params: Promise.resolve({ path: ['abc123', 'bid'] }) };
    const res = await POST(req, ctx);
    expect(res.status).toBe(401);
  });

  it('subpath: risponde 200 con cookie valido', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
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

// ─── /api/auctions guest QR pairing ──────────────────────────────────────────

describe('/api/auctions — guest QR pairing', () => {
  it('GET photos/pairing-sessions/:uuid con token valido passa senza cookie → 502', async () => {
    const { GET } = await import('@/app/api/auctions/[...path]/route');
    const req = makeRequest(`/api/auctions/photos/pairing-sessions/${VALID_PAIRING_SESSION_ID}`, {
      headers: { 'X-Pairing-Upload-Token': VALID_PAIRING_TOKEN },
    });
    const ctx = { params: Promise.resolve({ path: ['photos', 'pairing-sessions', VALID_PAIRING_SESSION_ID] }) };
    const res = await GET(req, ctx);
    expect(res.status).toBe(502);
  });

  it('POST photos/init con body valido passa senza cookie → 502', async () => {
    const { POST } = await import('@/app/api/auctions/[...path]/route');
    const req = makeRequest('/api/auctions/photos/init', {
      method: 'POST',
      body: JSON.stringify({
        pairing_session_id: VALID_PAIRING_SESSION_ID,
        pairing_upload_token: VALID_PAIRING_TOKEN,
      }),
    });
    const ctx = { params: Promise.resolve({ path: ['photos', 'init'] }) };
    const res = await POST(req, ctx);
    expect(res.status).toBe(502);
  });

  it('POST photos/finalize con body valido passa senza cookie → 502', async () => {
    const { POST } = await import('@/app/api/auctions/[...path]/route');
    const req = makeRequest('/api/auctions/photos/finalize', {
      method: 'POST',
      body: JSON.stringify({
        pairing_session_id: VALID_PAIRING_SESSION_ID,
        pairing_upload_token: VALID_PAIRING_TOKEN,
      }),
    });
    const ctx = { params: Promise.resolve({ path: ['photos', 'finalize'] }) };
    const res = await POST(req, ctx);
    expect(res.status).toBe(502);
  });

  it('GET pairing session con token vuoto viene trattato come GET pubblico → 502', async () => {
    const { GET } = await import('@/app/api/auctions/[...path]/route');
    const req = makeRequest(`/api/auctions/photos/pairing-sessions/${VALID_PAIRING_SESSION_ID}`, {
      headers: { 'X-Pairing-Upload-Token': '' },
    });
    const ctx = { params: Promise.resolve({ path: ['photos', 'pairing-sessions', VALID_PAIRING_SESSION_ID] }) };
    const res = await GET(req, ctx);
    expect(res.status).toBe(502);
  });

  it('POST photos/init con body mancante → 401', async () => {
    const { POST } = await import('@/app/api/auctions/[...path]/route');
    const req = makeRequest('/api/auctions/photos/init', { method: 'POST', body: '{}' });
    const ctx = { params: Promise.resolve({ path: ['photos', 'init'] }) };
    const res = await POST(req, ctx);
    expect(res.status).toBe(401);
  });

  it('POST photos/finalize con UUID non valido → 401', async () => {
    const { POST } = await import('@/app/api/auctions/[...path]/route');
    const req = makeRequest('/api/auctions/photos/finalize', {
      method: 'POST',
      body: JSON.stringify({
        pairing_session_id: 'not-a-uuid',
        pairing_upload_token: VALID_PAIRING_TOKEN,
      }),
    });
    const ctx = { params: Promise.resolve({ path: ['photos', 'finalize'] }) };
    const res = await POST(req, ctx);
    expect(res.status).toBe(401);
  });

  it('POST path diverso con body valido → 401', async () => {
    const { POST } = await import('@/app/api/auctions/[...path]/route');
    const req = makeRequest('/api/auctions/photos/attach-listing', {
      method: 'POST',
      body: JSON.stringify({
        pairing_session_id: VALID_PAIRING_SESSION_ID,
        pairing_upload_token: VALID_PAIRING_TOKEN,
      }),
    });
    const ctx = { params: Promise.resolve({ path: ['photos', 'attach-listing'] }) };
    const res = await POST(req, ctx);
    expect(res.status).toBe(401);
  });

  it('POST photos/init con UUID non valido → 401', async () => {
    const { POST } = await import('@/app/api/auctions/[...path]/route');
    const req = makeRequest('/api/auctions/photos/init', {
      method: 'POST',
      body: JSON.stringify({
        pairing_session_id: 'not-a-uuid',
        pairing_upload_token: VALID_PAIRING_TOKEN,
      }),
    });
    const ctx = { params: Promise.resolve({ path: ['photos', 'init'] }) };
    const res = await POST(req, ctx);
    expect(res.status).toBe(401);
  });

  it('POST photos/init con token troppo corto → 401', async () => {
    const { POST } = await import('@/app/api/auctions/[...path]/route');
    const req = makeRequest('/api/auctions/photos/init', {
      method: 'POST',
      body: JSON.stringify({
        pairing_session_id: VALID_PAIRING_SESSION_ID,
        pairing_upload_token: 'short',
      }),
    });
    const ctx = { params: Promise.resolve({ path: ['photos', 'init'] }) };
    const res = await POST(req, ctx);
    expect(res.status).toBe(401);
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

  it('checkRateLimit sync scope ritorna allowed:false dopo 30 richieste', async () => {
    const { checkRateLimit } = await import('@/app/api/_lib/rate-limit');
    const req = makeRequest('/api/sync/status', { cookie: VALID_COOKIE });
    const scope = `sync-exhausted-${Date.now()}`;
    for (let i = 0; i < 30; i++) {
      const result = checkRateLimit(req, { scope, limit: 30, windowMs: 60_000 });
      expect(result.allowed).toBe(true);
    }
    const blocked = checkRateLimit(req, { scope, limit: 30, windowMs: 60_000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });
});

// ─── /api/auth/bridge ────────────────────────────────────────────────────────

describe('/api/auth/bridge — sicurezza', () => {
  it('risponde 401 senza refresh cookie', async () => {
    const { GET } = await import('@/app/api/auth/bridge/route');
    const req = makeRequest('/api/auth/bridge');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('risponde 200 con refresh cookie valido e setta i cookie di sessione', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve({
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        expires_in: 3600,
      }),
    }));
    const { GET } = await import('@/app/api/auth/bridge/route');
    const req = makeRequest('/api/auth/bridge', { cookie: VALID_REFRESH_COOKIE });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.access_token).toBe('new_access_token');
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toBeTruthy();
    expect(setCookie).toMatch(/ebartex_access_token=new_access_token/);
    expect(setCookie).toMatch(/ebartex_refresh_token=new_refresh_token/);
  });

  it('risponde 502 se il backend refresh non restituisce i token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ detail: 'ok' }),
    }));
    const { GET } = await import('@/app/api/auth/bridge/route');
    const req = makeRequest('/api/auth/bridge', { cookie: VALID_REFRESH_COOKIE });
    const res = await GET(req);
    expect(res.status).toBe(502);
  });

  it('risponde 502 su errore di rete dal backend auth', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connection refused')));
    const { GET } = await import('@/app/api/auth/bridge/route');
    const req = makeRequest('/api/auth/bridge', { cookie: VALID_REFRESH_COOKIE });
    const res = await GET(req);
    expect(res.status).toBe(502);
  });
});

// ─── /api/marketplace ────────────────────────────────────────────────────────

describe('/api/marketplace — cache pubblica e sicurezza privata', () => {
  it('listings/public/* → 200 con cache pubblica s-maxage=30', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
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
      ok: true,
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

describe('/api/trades - sicurezza privata', () => {
  it('root GET senza cookie risponde 401', async () => {
    const { GET } = await import('@/app/api/trades/route');
    const res = await GET(makeRequest('/api/trades'));
    expect(res.status).toBe(401);
    expect(res.headers.get('cache-control')).toMatch(/no-store/);
  });

  it('subpath GET senza cookie risponde 401', async () => {
    const { GET } = await import('@/app/api/trades/[...path]/route');
    const res = await GET(makeRequest('/api/trades/1'), {
      params: Promise.resolve({ path: ['1'] }),
    });
    expect(res.status).toBe(401);
  });

  it('inoltra le chiavi di idempotenza e tracciamento', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ success: true, data: {} }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { POST } = await import('@/app/api/trades/route');
    const res = await POST(makeRequest('/api/trades', {
      method: 'POST',
      cookie: VALID_COOKIE,
      body: '{}',
      headers: { 'Idempotency-Key': 'trade-key', 'X-Request-ID': 'request-key' },
    }));
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Idempotency-Key': 'trade-key',
          'X-Request-ID': 'request-key',
        }),
      }),
    );
  });
});
