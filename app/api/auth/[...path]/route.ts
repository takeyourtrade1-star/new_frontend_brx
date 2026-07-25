/**
 * Proxy to Auth microservice.
 * Avoids CORS: browser calls same-origin /api/auth/... and this route forwards to AUTH_API_URL.
 *
 * IMPORTANT: fetch verso l'auth API deve essere sempre no-store. Altrimenti Next può cachare GET
 * come /me e si vedono dati utente obsoleti (es. mfa_enabled false dopo MFA abilitata con successo).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getForwardedAuthorization } from '@/app/api/_lib/forwarded-authorization';
import {
  buildTrustedDeviceRequestCookie,
  getSetCookieHeaders,
  getTrustedDeviceAuthPolicy,
  MFA_TRUST_COOKIE,
  parseTrustedDeviceSetCookies,
  serializeTrustedDeviceCookie,
} from '@/lib/auth/trusted-device-cookie';

export const dynamic = 'force-dynamic';
const MAX_AUTH_BODY_BYTES = 128 * 1024;

const AUTH_API_URL = (
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  process.env.AUTH_API_URL ||
  process.env.VITE_AWS_AUTH_URL ||
  ''
).replace(/\/+$/, '');

type AllowedMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

const EXACT_AUTH_ROUTES: Readonly<Record<string, readonly AllowedMethod[]>> = {
  login: ['POST'],
  'login/code/request': ['POST'],
  'login/code/verify': ['POST'],
  register: ['POST'],
  refresh: ['POST'],
  me: ['GET'],
  logout: ['POST'],
  'username-available': ['GET'],
  'change-password': ['POST'],
  'verify-mfa': ['POST'],
  'mfa/enable': ['POST'],
  'mfa/verify': ['POST'],
  'mfa/disable': ['POST'],
  'mfa/status': ['GET'],
  'password/reset': ['POST'],
  'password/reset/request': ['POST'],
  'password/reset/verify-code': ['POST'],
  'password/reset/confirm': ['POST'],
  'password/reset/confirm-init': ['POST'],
  'password/reset/confirm-final': ['POST'],
  'verify-email': ['POST'],
  'verify-email/code': ['POST'],
  'verify-email/token': ['POST'],
  'resend-verification': ['POST'],
};
const PUBLIC_USER_EXACT_ROUTES = new Set(['users/public', 'users/search']);
const PUBLIC_USERNAME_RE = /^[A-Za-z0-9_.-]{1,50}$/;
const RESERVED_USER_SEGMENTS = new Set(['internal', 'public', 'search']);

const AUTH_COOKIE_NAME = 'ebartex_access_token';
const DEFAULT_ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24; // 24h

// SSO cross-subdomain (tournaments.ebartex.com): refresh token come cookie HttpOnly
// condiviso col parent domain. In produzione impostare AUTH_COOKIE_DOMAIN=.ebartex.com
// (env Amplify). Vuoto in locale → cookie host-only, comportamento invariato.
const REFRESH_COOKIE_NAME = 'ebartex_refresh_token';
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30; // 30 giorni
const AUTH_COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN || '';

function isAllowedPath(segments: string[], method: string): boolean {
  const joined = segments.join('/');
  const exactMethods = EXACT_AUTH_ROUTES[joined];
  if (exactMethods?.includes(method as AllowedMethod)) return true;
  if (method !== 'GET') return false;
  if (PUBLIC_USER_EXACT_ROUTES.has(joined)) return true;

  if (segments[0] !== 'users') return false;
  const username = segments[1];
  if (
    !username ||
    RESERVED_USER_SEGMENTS.has(username.toLowerCase()) ||
    !PUBLIC_USERNAME_RE.test(username)
  ) {
    return false;
  }
  return segments.length === 2 || (segments.length === 3 && segments[2] === 'collection');
}

function extractAccessToken(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const data = payload as Record<string, unknown>;

  const directToken = data.access_token;
  if (typeof directToken === 'string' && directToken.length > 0) return directToken;

  const nested = data.data;
  if (!nested || typeof nested !== 'object') return undefined;
  const nestedToken = (nested as Record<string, unknown>).access_token;
  return typeof nestedToken === 'string' && nestedToken.length > 0 ? nestedToken : undefined;
}

function extractRefreshToken(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const data = payload as Record<string, unknown>;

  const directToken = data.refresh_token;
  if (typeof directToken === 'string' && directToken.length > 0) return directToken;

  const nested = data.data;
  if (!nested || typeof nested !== 'object') return undefined;
  const nestedToken = (nested as Record<string, unknown>).refresh_token;
  return typeof nestedToken === 'string' && nestedToken.length > 0 ? nestedToken : undefined;
}

function redactRefreshTokens(payload: unknown): unknown {
  if (Array.isArray(payload)) return payload.map(redactRefreshTokens);
  if (!payload || typeof payload !== 'object') return payload;

  return Object.fromEntries(
    Object.entries(payload as Record<string, unknown>)
      .filter(([key]) => key !== 'refresh_token')
      .map(([key, value]) => [key, redactRefreshTokens(value)])
  );
}

async function readRequestBodyWithLimit(
  request: NextRequest
): Promise<{ body?: string; tooLarge: boolean }> {
  const declaredLength = Number(request.headers.get('content-length'));
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > MAX_AUTH_BODY_BYTES
  ) {
    return { tooLarge: true };
  }
  if (!request.body) return { body: undefined, tooLarge: false };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_AUTH_BODY_BYTES) {
        await reader.cancel();
        return { tooLarge: true };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return {
    body: totalBytes > 0 ? new TextDecoder().decode(merged) : undefined,
    tooLarge: false,
  };
}

/** Cookie auth con Domain parent opzionale (SSO) — stesso formato usato dal sito tornei. */
function buildAuthCookie(name: string, value: string, maxAge: number, isSecure: boolean): string {
  const domain = AUTH_COOKIE_DOMAIN ? `; Domain=${AUTH_COOKIE_DOMAIN}` : '';
  const secureFlag = isSecure ? '; Secure' : '';
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${domain}${secureFlag}`;
}

function extractExpiresIn(payload: unknown): number {
  if (!payload || typeof payload !== 'object') return DEFAULT_ACCESS_TOKEN_MAX_AGE;
  const data = payload as Record<string, unknown>;

  const direct = data.expires_in;
  if (typeof direct === 'number' && Number.isFinite(direct) && direct > 0) return Math.floor(direct);

  const nested = data.data;
  if (!nested || typeof nested !== 'object') return DEFAULT_ACCESS_TOKEN_MAX_AGE;
  const nestedExpires = (nested as Record<string, unknown>).expires_in;
  if (typeof nestedExpires === 'number' && Number.isFinite(nestedExpires) && nestedExpires > 0) {
    return Math.floor(nestedExpires);
  }

  return DEFAULT_ACCESS_TOKEN_MAX_AGE;
}

async function proxy(request: NextRequest, pathSegments: string[]) {
  if (!AUTH_API_URL) {
    return NextResponse.json(
      { detail: 'NEXT_PUBLIC_AUTH_API_URL is not configured' },
      { status: 503 }
    );
  }

  if (!isAllowedPath(pathSegments, request.method)) {
    return NextResponse.json(
      { detail: 'Not found' },
      { status: 404 }
    );
  }

  const path = pathSegments.join('/');
  const targetPath = `/api/auth${path ? `/${path}` : ''}`;
  const url = new URL(targetPath, AUTH_API_URL);
  
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const auth = getForwardedAuthorization(request);
  const idempotencyKey = request.headers.get('idempotency-key');
  const authPath = `/api/auth/${path}`;
  const trustedDevicePolicy = getTrustedDeviceAuthPolicy(authPath);
  const trustedDeviceCookie = buildTrustedDeviceRequestCookie(
    trustedDevicePolicy.forwardCookie
      ? request.cookies.get(MFA_TRUST_COOKIE)?.value
      : undefined
  );
  const userAgent = trustedDevicePolicy.forwardUserAgent
    ? request.headers.get('user-agent')
    : null;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(auth ? { Authorization: auth } : {}),
    ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    ...(trustedDeviceCookie ? { Cookie: trustedDeviceCookie } : {}),
    ...(userAgent ? { 'User-Agent': userAgent } : {}),
  };
  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    if (path === 'refresh' || path === 'logout') {
      const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
      if (!refreshToken) {
        return NextResponse.json(
          { detail: 'No refresh session' },
          {
            status: 401,
            headers: {
              'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
            },
          }
        );
      }
      body = JSON.stringify({ refresh_token: refreshToken });
      headers['Content-Type'] = 'application/json';
    } else {
      const bodyResult = await readRequestBodyWithLimit(request);
      if (bodyResult.tooLarge) {
        return NextResponse.json(
          { detail: 'Request body too large' },
          {
            status: 413,
            headers: {
              'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
            },
          }
        );
      }
      body = bodyResult.body;
      if (body) {
        headers['Content-Type'] =
          request.headers.get('content-type') || 'application/json';
      }
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url.toString(), {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
      next: { revalidate: 0 },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));
    
    const data = await res.json().catch(() => ({}));

    // 1. Creiamo gli header di risposta
    const responseHeaders = new Headers();
    responseHeaders.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');

    const trustedDeviceUpdate = trustedDevicePolicy.acceptSetCookie
      ? parseTrustedDeviceSetCookies(getSetCookieHeaders(res.headers))
      : null;
    if (trustedDeviceUpdate) {
      responseHeaders.append(
        'Set-Cookie',
        serializeTrustedDeviceCookie(trustedDeviceUpdate)
      );
    }

    const accessToken = extractAccessToken(data);
    const isSecure =
      process.env.NODE_ENV === 'production' ||
      request.nextUrl.protocol === 'https:' ||
      request.headers.get('x-forwarded-proto') === 'https';

    if (accessToken) {
      const maxAge = extractExpiresIn(data);
      responseHeaders.append(
        'Set-Cookie',
        buildAuthCookie(AUTH_COOKIE_NAME, accessToken, maxAge, isSecure)
      );
      // SSO: il refresh token come cookie HttpOnly parent-domain permette a
      // tournaments.ebartex.com il silent refresh (route /auth/bridge) senza
      // passare token via URL. Impostato su login/refresh, ruotato se il backend ruota.
      const refreshToken = extractRefreshToken(data);
      if (refreshToken) {
        responseHeaders.append(
          'Set-Cookie',
          buildAuthCookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_TOKEN_MAX_AGE, isSecure)
        );
      }
    } else if (pathSegments[0] === 'logout') {
      // Logout: cancella entrambi i cookie (stesso Domain con cui sono stati impostati).
      responseHeaders.append(
        'Set-Cookie',
        buildAuthCookie(AUTH_COOKIE_NAME, '', 0, isSecure)
      );
      responseHeaders.append(
        'Set-Cookie',
        buildAuthCookie(REFRESH_COOKIE_NAME, '', 0, isSecure)
      );
    }

    return NextResponse.json(redactRefreshTokens(data), {
      status: res.status,
      headers: responseHeaders,
    });
    
  } catch (err) {
    console.error('[auth proxy] Error forwarding to', url?.toString(), ':', err instanceof Error ? err.message : err);
    // Dettaglio dell'errore solo nei log server (sopra); al client messaggio generico.
    const isTimeout = err instanceof DOMException && err.name === 'AbortError';
    return NextResponse.json(
      { detail: isTimeout ? 'Request timed out' : 'Authentication service unavailable' },
      { status: 502 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(request, path);
}
