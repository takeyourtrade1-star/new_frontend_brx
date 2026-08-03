/**
 * Compatibilita' per i client che usavano il vecchio bridge SSO.
 *
 * La sessione e' ora esclusivamente host-only: questa route puo' ruotare il
 * refresh cookie del sito corrente, ma non condivide cookie tra sottodomini e
 * non restituisce mai token a JavaScript.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  isSecureRequest,
  legacyAuthCookieDeletions,
  readAuthCookie,
  serializeAuthCookie,
} from '@/app/api/_lib/auth-cookies';
import { enforceSameOrigin } from '@/app/api/_lib/request-security';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';
import { noStoreHeaders } from '@/app/api/_lib/proxy-response';
import { readJsonResponseWithLimit } from '@/app/api/_lib/bounded-json-response';
import { trustedAuthServiceOrigin } from '@/app/api/_lib/upstream-url';
import { fetchWithBodyDeadline } from '@/app/api/_lib/upstream-fetch';
import { getAuthApiUrlEnv } from '@/lib/server-runtime-env';

export const dynamic = 'force-dynamic';

const AUTH_API_URL = trustedAuthServiceOrigin(
  getAuthApiUrlEnv()
);
const DEFAULT_ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24;
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30;
const AUTH_BRIDGE_TIMEOUT_MS = 15_000;
const MAX_AUTH_RESPONSE_BYTES = 256 * 1024;

function tokenFrom(payload: unknown, key: 'access_token' | 'refresh_token'): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const data = payload as Record<string, unknown>;
  if (typeof data[key] === 'string' && data[key]) return data[key] as string;
  const nested = data.data;
  if (!nested || typeof nested !== 'object') return undefined;
  const value = (nested as Record<string, unknown>)[key];
  return typeof value === 'string' && value ? value : undefined;
}
function expiresIn(payload: unknown): number {
  if (!payload || typeof payload !== 'object') return DEFAULT_ACCESS_TOKEN_MAX_AGE;
  const data = payload as Record<string, unknown>;
  const direct = data.expires_in;
  if (typeof direct === 'number' && direct > 0) return Math.floor(direct);
  const nested = data.data;
  const value = nested && typeof nested === 'object'
    ? (nested as Record<string, unknown>).expires_in
    : undefined;
  return typeof value === 'number' && value > 0
    ? Math.floor(value)
    : DEFAULT_ACCESS_TOKEN_MAX_AGE;
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { detail: 'Metodo non consentito' },
    { status: 405, headers: noStoreHeaders({ Allow: 'POST' }) },
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originViolation = enforceSameOrigin(request);
  if (originViolation) return originViolation;

  const limit = await checkRateLimit(request, {
    scope: 'auth:bridge',
    limit: 10,
    windowMs: 5 * 60_000,
  });
  if (!limit.allowed) return rateLimitExceededResponse(limit);

  if (!AUTH_API_URL) {
    return NextResponse.json(
      { detail: 'Authentication service unavailable' },
      { status: 503, headers: noStoreHeaders() },
    );
  }
  const refreshToken = readAuthCookie(request, 'refresh');
  if (!refreshToken) {
    return NextResponse.json(
      { detail: 'No refresh session' },
      { status: 401, headers: noStoreHeaders() },
    );
  }

  try {
    const upstream = await fetchWithBodyDeadline(`${AUTH_API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'identity',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: 'no-store',
      redirect: 'error',
    }, AUTH_BRIDGE_TIMEOUT_MS);
    const data = await readJsonResponseWithLimit(upstream, MAX_AUTH_RESPONSE_BYTES);
    if (!upstream.ok) {
      return NextResponse.json(
        { detail: upstream.status === 401 ? 'Refresh session invalid' : 'Authentication service unavailable' },
        { status: upstream.status === 401 ? 401 : 502, headers: noStoreHeaders() },
      );
    }

    const accessToken = tokenFrom(data, 'access_token');
    const newRefreshToken = tokenFrom(data, 'refresh_token');
    if (!accessToken || !newRefreshToken) {
      return NextResponse.json(
        { detail: 'Invalid refresh response' },
        { status: 502, headers: noStoreHeaders() },
      );
    }

    const secure = isSecureRequest(request);
    const headers = noStoreHeaders();
    headers.append('Set-Cookie', serializeAuthCookie('access', accessToken, expiresIn(data), secure));
    headers.append(
      'Set-Cookie',
      serializeAuthCookie('refresh', newRefreshToken, REFRESH_TOKEN_MAX_AGE, secure),
    );
    for (const deletion of legacyAuthCookieDeletions(secure)) {
      headers.append('Set-Cookie', deletion);
    }
    return NextResponse.json({ authenticated: true }, { status: 200, headers });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'AbortError';
    return NextResponse.json(
      { detail: timedOut ? 'Authentication service timed out' : 'Authentication service unavailable' },
      { status: timedOut ? 504 : 502, headers: noStoreHeaders() },
    );
  }
}
