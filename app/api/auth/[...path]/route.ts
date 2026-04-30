/**
 * Proxy to Auth microservice.
 * Avoids CORS: browser calls same-origin /api/auth/... and this route forwards to AUTH_API_URL.
 *
 * IMPORTANT: fetch verso l'auth API deve essere sempre no-store. Altrimenti Next può cachare GET
 * come /me e si vedono dati utente obsoleti (es. mfa_enabled false dopo MFA abilitata con successo).
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const AUTH_API_URL = (
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  process.env.AUTH_API_URL ||
  process.env.VITE_AWS_AUTH_URL ||
  ''
).replace(/\/+$/, '');

const ALLOWED_AUTH_PATHS = [
  'login',
  'login/code/request',
  'login/code/verify',
  'register',
  'refresh',
  'me',
  'logout',
  'verify-mfa',
  'mfa/enable',
  'mfa/verify',
  'mfa/disable',
  'mfa/status',
  'password/reset',
  'password/reset/confirm',
  'verify-email',
  'resend-verification',
];

const AUTH_COOKIE_NAME = 'ebartex_access_token';
const DEFAULT_ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24; // 24h

function isAllowedPath(segments: string[]): boolean {
  const joined = segments.join('/');
  return ALLOWED_AUTH_PATHS.some(
    (allowed) => joined === allowed || joined.startsWith(`${allowed}/`) || joined.startsWith(`${allowed}?`)
  );
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

  if (!isAllowedPath(pathSegments)) {
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

  const auth = request.headers.get('authorization') || request.headers.get('Authorization');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(auth ? { Authorization: auth } : {}),
  };

  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text();
    if (body) headers['Content-Type'] = request.headers.get('content-type') || 'application/json';
  }

  try {
    const res = await fetch(url.toString(), {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    
    const data = await res.json().catch(() => ({}));
    
    // 1. Creiamo gli header di risposta
    const responseHeaders = new Headers();
    responseHeaders.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');

    // 2. Inoltriamo i Cookie dal backend al browser!
    const setCookies = res.headers.getSetCookie();
    if (setCookies && setCookies.length > 0) {
      for (const cookie of setCookies) {
        responseHeaders.append('Set-Cookie', cookie);
      }
    }

    const accessToken = extractAccessToken(data);
    const isSecure =
      process.env.NODE_ENV === 'production' ||
      request.nextUrl.protocol === 'https:' ||
      request.headers.get('x-forwarded-proto') === 'https';

    if (accessToken) {
      const maxAge = extractExpiresIn(data);
      const secureFlag = isSecure ? '; Secure' : '';
      responseHeaders.append(
        'Set-Cookie',
        `${AUTH_COOKIE_NAME}=${encodeURIComponent(accessToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secureFlag}`
      );
    } else if (pathSegments[0] === 'logout') {
      const secureFlag = isSecure ? '; Secure' : '';
      responseHeaders.append(
        'Set-Cookie',
        `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`
      );
    }

    return NextResponse.json(data, {
      status: res.status,
      headers: responseHeaders,
    });
    
  } catch (err) {
    console.error('[auth proxy]', err);
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : 'Proxy request failed' },
      { status: 502 }
    );
  }
} // <--- MANCAVA QUESTA PARENTESI PER CHIUDERE LA FUNZIONE PROXY!

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