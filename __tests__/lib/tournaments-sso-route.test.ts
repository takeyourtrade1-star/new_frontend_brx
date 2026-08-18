// @vitest-environment node

import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkRateLimit } from '@/app/api/_lib/rate-limit';

vi.mock('@/app/api/_lib/rate-limit', () => ({
  checkRateLimit: vi.fn(),
}));

import { GET } from '@/app/api/auth/sso/authorize/route';
import {
  getTournamentsPortalUrl,
  TOURNAMENTS_SSO_CALLBACK_URL,
} from '@/lib/config/tournaments';

const STATE = 'a'.repeat(43);
const CHALLENGE = 'p'.repeat(43);
const CODE = 'c'.repeat(43);
const CLIENT_SECRET = 'm'.repeat(48);
const REFRESH_TOKEN = 'refresh.source-token';
const fetchMock = vi.fn();

function authorizeRequest(
  overrides: Partial<Record<string, string>> = {},
  withCookie = true,
  extraHeaders: HeadersInit = {},
  cookieName = 'ebartex_refresh_token',
): NextRequest {
  const url = new URL('https://www.ebartex.com/api/auth/sso/authorize');
  const params = {
    client_id: 'tournaments',
    redirect_uri: TOURNAMENTS_SSO_CALLBACK_URL,
    state: STATE,
    code_challenge: CHALLENGE,
    code_challenge_method: 'S256',
    ...overrides,
  };
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return new NextRequest(url, {
    headers: {
      ...(withCookie ? { Cookie: `${cookieName}=${REFRESH_TOKEN}` } : {}),
      'Sec-Fetch-Site': 'same-site',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Dest': 'document',
      ...extraHeaders,
    },
  });
}

function authCodeResponse(status = 200): Response {
  const body = JSON.stringify({ code: CODE, expires_in: 60 });
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': String(Buffer.byteLength(body)),
    },
  });
}

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'development');
  vi.stubEnv('AUTH_API_URL', 'http://127.0.0.1:8000');
  vi.stubEnv('SSO_HANDOFF_ENABLED', 'true');
  vi.stubEnv('SSO_MARKETPLACE_CLIENT_SECRET', CLIENT_SECRET);
  vi.mocked(checkRateLimit).mockResolvedValue({
    allowed: true,
    limit: 10,
    remaining: 9,
    retryAfterSec: 300,
  });
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('GET /api/auth/sso/authorize', () => {
  it('usa il refresh cookie soltanto nella chiamata server-to-server', async () => {
    fetchMock.mockResolvedValueOnce(authCodeResponse());
    const response = await GET(authorizeRequest());
    const location = new URL(response.headers.get('location')!);

    expect(location.origin + location.pathname).toBe(TOURNAMENTS_SSO_CALLBACK_URL);
    expect(location.searchParams.get('code')).toBe(CODE);
    expect(location.searchParams.get('state')).toBe(STATE);
    expect(location.href).not.toContain(REFRESH_TOKEN);
    expect(location.href).not.toContain(CLIENT_SECRET);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    const headers = new Headers(init.headers);
    const body = JSON.parse(String(init.body)) as Record<string, string>;
    expect(String(url)).toBe('http://127.0.0.1:8000/api/auth/sso/authorize');
    expect(init.redirect).toBe('error');
    expect(headers.get('X-SSO-Client-ID')).toBe('marketplace');
    expect(headers.get('X-SSO-Client-Secret')).toBe(CLIENT_SECRET);
    expect(body).toEqual({
      refresh_token: REFRESH_TOKEN,
      target_client_id: 'tournaments',
      redirect_uri: TOURNAMENTS_SSO_CALLBACK_URL,
      code_challenge: CHALLENGE,
      code_challenge_method: 'S256',
    });
  });

  it('se la sessione Ebartex manca torna al callback senza chiamare Auth', async () => {
    const response = await GET(authorizeRequest({}, false));
    const location = new URL(response.headers.get('location')!);

    expect(location.origin + location.pathname).toBe(TOURNAMENTS_SSO_CALLBACK_URL);
    expect(location.searchParams.get('error')).toBe('login_required');
    expect(location.searchParams.get('state')).toBe(STATE);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('usa in produzione solo il cookie __Host e un origin Auth allowlisted', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AUTH_API_URL', 'https://auth.ebartex.com');
    vi.stubEnv('TRUSTED_UPSTREAM_HOSTS', 'auth.ebartex.com');
    fetchMock.mockResolvedValueOnce(authCodeResponse());

    const response = await GET(authorizeRequest(
      {},
      true,
      {},
      '__Host-ebartex_refresh_token',
    ));

    expect(new URL(response.headers.get('location')!).searchParams.get('code')).toBe(CODE);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      'https://auth.ebartex.com/api/auth/sso/authorize',
    );
  });

  it('accetta soltanto callback e parametri esatti, senza open redirect', async () => {
    const response = await GET(authorizeRequest({
      redirect_uri: 'https://evil.example/collect',
    }));
    const location = new URL(response.headers.get('location')!);

    expect(location.origin + location.pathname).toBe(TOURNAMENTS_SSO_CALLBACK_URL);
    expect(location.href).not.toContain('evil.example');
    expect(location.searchParams.get('error')).toBe('invalid_request');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rifiuta parametri duplicati e richieste non di navigazione', async () => {
    const duplicate = authorizeRequest();
    duplicate.nextUrl.searchParams.append('state', STATE);
    const duplicateResponse = await GET(duplicate);
    expect(new URL(duplicateResponse.headers.get('location')!).searchParams.get('error'))
      .toBe('invalid_request');

    const nonNavigate = await GET(authorizeRequest({}, true, {
      'Sec-Fetch-Mode': 'cors',
    }));
    expect(new URL(nonNavigate.headers.get('location')!).searchParams.get('error'))
      .toBe('invalid_request');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fallisce chiuso se flag, secret o rate limit non sono disponibili', async () => {
    vi.stubEnv('SSO_HANDOFF_ENABLED', 'false');
    let response = await GET(authorizeRequest());
    expect(new URL(response.headers.get('location')!).searchParams.get('error'))
      .toBe('temporarily_unavailable');

    vi.stubEnv('SSO_HANDOFF_ENABLED', 'true');
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      allowed: false,
      limit: 10,
      remaining: 0,
      retryAfterSec: 300,
    });
    response = await GET(authorizeRequest());
    expect(new URL(response.headers.get('location')!).searchParams.get('error'))
      .toBe('temporarily_unavailable');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('traduce un rifiuto Auth in errore generico senza inoltrare il body', async () => {
    fetchMock.mockResolvedValueOnce(authCodeResponse(401));
    const response = await GET(authorizeRequest());
    const location = new URL(response.headers.get('location')!);

    expect(location.searchParams.get('error')).toBe('login_required');
    expect(location.searchParams.has('code')).toBe(false);
  });
});

describe('link Tornei', () => {
  it('porta sempre allo start SSO con una destinazione interna sanitizzata', () => {
    expect(getTournamentsPortalUrl('/partite?tab=attive')).toBe(
      'https://tornei.ebartex.com/auth/bridge/sso/start?next=%2Fpartite%3Ftab%3Dattive',
    );
    expect(getTournamentsPortalUrl('https://evil.example')).toBe(
      'https://tornei.ebartex.com/auth/bridge/sso/start?next=%2F',
    );
  });
});
