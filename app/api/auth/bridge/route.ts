/**
 * SSO bridge — legge il refresh token HttpOnly (Domain=.ebartex.com) e
 * restituisce i token al client per sincronizzare localStorage sul marketplace.
 * Usato quando l'utente è già loggato su tornei.ebartex.com nello stesso browser.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const AUTH_API_URL = (
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  process.env.AUTH_API_URL ||
  process.env.VITE_AWS_AUTH_URL ||
  ''
).replace(/\/+$/, '');

const AUTH_COOKIE_NAME = 'ebartex_access_token';
const REFRESH_COOKIE_NAME = 'ebartex_refresh_token';
const DEFAULT_ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24;
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30;
const AUTH_COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN || '';

function buildAuthCookie(name: string, value: string, maxAge: number, isSecure: boolean): string {
  const domain = AUTH_COOKIE_DOMAIN ? `; Domain=${AUTH_COOKIE_DOMAIN}` : '';
  const secureFlag = isSecure ? '; Secure' : '';
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${domain}${secureFlag}`;
}

function extractAccessToken(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const data = payload as Record<string, unknown>;
  if (typeof data.access_token === 'string' && data.access_token.length > 0) {
    return data.access_token;
  }
  const nested = data.data;
  if (!nested || typeof nested !== 'object') return undefined;
  const nestedToken = (nested as Record<string, unknown>).access_token;
  return typeof nestedToken === 'string' && nestedToken.length > 0 ? nestedToken : undefined;
}

function extractRefreshToken(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const data = payload as Record<string, unknown>;
  if (typeof data.refresh_token === 'string' && data.refresh_token.length > 0) {
    return data.refresh_token;
  }
  const nested = data.data;
  if (!nested || typeof nested !== 'object') return undefined;
  const nestedToken = (nested as Record<string, unknown>).refresh_token;
  return typeof nestedToken === 'string' && nestedToken.length > 0 ? nestedToken : undefined;
}

function extractExpiresIn(payload: unknown): number {
  if (!payload || typeof payload !== 'object') return DEFAULT_ACCESS_TOKEN_MAX_AGE;
  const data = payload as Record<string, unknown>;
  if (typeof data.expires_in === 'number' && data.expires_in > 0) return Math.floor(data.expires_in);
  const nested = data.data;
  if (!nested || typeof nested !== 'object') return DEFAULT_ACCESS_TOKEN_MAX_AGE;
  const nestedExpires = (nested as Record<string, unknown>).expires_in;
  if (typeof nestedExpires === 'number' && nestedExpires > 0) return Math.floor(nestedExpires);
  return DEFAULT_ACCESS_TOKEN_MAX_AGE;
}

export async function GET(request: NextRequest) {
  if (!AUTH_API_URL) {
    return NextResponse.json({ detail: 'Auth API not configured' }, { status: 503 });
  }

  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (!refreshToken) {
    return NextResponse.json({ detail: 'No shared session' }, { status: 401 });
  }

  const isSecure =
    process.env.NODE_ENV === 'production' ||
    request.nextUrl.protocol === 'https:' ||
    request.headers.get('x-forwarded-proto') === 'https';

  try {
    const res = await fetch(`${AUTH_API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    const accessToken = extractAccessToken(data);
    const newRefreshToken = extractRefreshToken(data);
    if (!accessToken || !newRefreshToken) {
      return NextResponse.json({ detail: 'Invalid refresh response' }, { status: 502 });
    }

    const responseHeaders = new Headers();
    responseHeaders.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
    const maxAge = extractExpiresIn(data);
    responseHeaders.append(
      'Set-Cookie',
      buildAuthCookie(AUTH_COOKIE_NAME, accessToken, maxAge, isSecure)
    );
    responseHeaders.append(
      'Set-Cookie',
      buildAuthCookie(REFRESH_COOKIE_NAME, newRefreshToken, REFRESH_TOKEN_MAX_AGE, isSecure)
    );

    return NextResponse.json(
      { access_token: accessToken, refresh_token: newRefreshToken, expires_in: maxAge },
      { status: 200, headers: responseHeaders }
    );
  } catch (err) {
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : 'Bridge failed' },
      { status: 502 }
    );
  }
}
