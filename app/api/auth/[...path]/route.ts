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
  isSecureRequest,
  legacyAuthCookieDeletions,
  readAuthCookie,
  serializeAuthCookie,
} from '@/app/api/_lib/auth-cookies';
import { enforceSameOrigin } from '@/app/api/_lib/request-security';
import { noStoreHeaders } from '@/app/api/_lib/proxy-response';
import {
  readTextBodyWithLimit,
  RequestBodyTimeoutError,
} from '@/app/api/_lib/request-body';
import { readJsonResponseWithLimit } from '@/app/api/_lib/bounded-json-response';
import { fetchWithBodyDeadline } from '@/app/api/_lib/upstream-fetch';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';
import { trustedAuthServiceOrigin } from '@/app/api/_lib/upstream-url';
import {
  appendQueryWithPolicy,
  QUERY_INTEGER,
  QUERY_POSITIVE_INTEGER,
  QUERY_UUID,
  type QueryRules,
} from '@/app/api/_lib/query-policy';
import {
  buildTrustedDeviceRequestCookie,
  getSetCookieHeaders,
  getTrustedDeviceAuthPolicy,
  MFA_TRUST_COOKIE,
  parseTrustedDeviceSetCookies,
  serializeTrustedDeviceCookie,
} from '@/lib/auth/trusted-device-cookie';
import {
  getAuthApiUrlEnv,
  getAuthInternalIdentityEnv,
} from '@/lib/server-runtime-env';

export const dynamic = 'force-dynamic';
const MAX_AUTH_BODY_BYTES = 128 * 1024;
const MAX_AUTH_RESPONSE_BYTES = 256 * 1024;
const LOGOUT_REVOCATION_TIMEOUT_MS = 3_000;

const AUTH_API_URL = trustedAuthServiceOrigin(
  getAuthApiUrlEnv()
);
const {
  caller: AUTH_INTERNAL_CALLER,
  token: AUTH_INTERNAL_CALLER_TOKEN,
} = getAuthInternalIdentityEnv();

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
  'password/reset/request': ['POST'],
  'password/reset/verify-code': ['POST'],
  'password/reset/confirm-init': ['POST'],
  'password/reset/confirm-final': ['POST'],
  'password/reset/clear-session': ['POST'],
  'verify-email': ['POST'],
  'verify-email/code': ['POST'],
  'verify-email/token': ['POST'],
  'resend-verification': ['POST'],
};
const PUBLIC_USER_EXACT_ROUTES = new Set(['users/public', 'users/search']);
const ACCESS_TOKEN_RESPONSE_PATHS = new Set([
  'login',
  'login/code/verify',
  'register',
  'refresh',
  'verify-mfa',
]);
const PREAUTH_TOKEN_RESPONSE_PATHS = new Set(['login', 'login/code/verify']);
const PUBLIC_USERNAME_RE = /^[A-Za-z0-9_.-]{1,50}$/;
const RESERVED_USER_SEGMENTS = new Set(['internal', 'public', 'search']);

const DEFAULT_ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24; // 24h
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30; // 30 giorni
const PREAUTH_TOKEN_MAX_AGE = 10 * 60; // MFA login hand-off only
const PASSWORD_RESET_TOKEN_MAX_AGE = 10 * 60;
// Keep enough headroom below the common 4096-byte per-cookie limit for the
// cookie name and security attributes; oversized upstream JWTs fail closed.
const PASSWORD_RESET_TOKEN_PATTERN = /^[A-Za-z0-9._~-]{32,3800}$/;
const AUTH_COOKIE_TOKEN_PATTERN = /^[A-Za-z0-9._~-]{1,3800}$/;
const LEGACY_REFRESH_COOKIE_NAME = 'ebartex_refresh_token';

type PasswordResetTokenType = 'password_reset' | 'password_reset_confirm';

interface PasswordResetHandoff {
  token: string;
  expiresInSeconds: number;
}

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

function authQueryRules(path: string): QueryRules {
  if (path === 'username-available') {
    return { username: PUBLIC_USERNAME_RE };
  }
  if (path === 'users/public') {
    return {
      ids: (value) => {
        const ids = value.split(',');
        return ids.length >= 1 && ids.length <= 100 && ids.every((id) => QUERY_UUID.test(id));
      },
    };
  }
  if (path === 'users/search') {
    return {
      q: (value) => value.length >= 2 && value.length <= 50 && !/[\u0000-\u001f\u007f]/u.test(value),
      limit: QUERY_POSITIVE_INTEGER,
      offset: QUERY_INTEGER,
    };
  }
  if (/^users\/[A-Za-z0-9_.-]{1,50}\/collection$/.test(path)) {
    return { limit: QUERY_POSITIVE_INTEGER, offset: QUERY_INTEGER };
  }
  return {};
}

function extractAccessToken(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const data = payload as Record<string, unknown>;

  const directToken = data.access_token;
  if (typeof directToken === 'string' && AUTH_COOKIE_TOKEN_PATTERN.test(directToken)) {
    return directToken;
  }

  const nested = data.data;
  if (!nested || typeof nested !== 'object') return undefined;
  const nestedToken = (nested as Record<string, unknown>).access_token;
  return typeof nestedToken === 'string' && AUTH_COOKIE_TOKEN_PATTERN.test(nestedToken)
    ? nestedToken
    : undefined;
}

function extractRefreshToken(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const data = payload as Record<string, unknown>;

  const directToken = data.refresh_token;
  if (typeof directToken === 'string' && AUTH_COOKIE_TOKEN_PATTERN.test(directToken)) {
    return directToken;
  }

  const nested = data.data;
  if (!nested || typeof nested !== 'object') return undefined;
  const nestedToken = (nested as Record<string, unknown>).refresh_token;
  return typeof nestedToken === 'string' && AUTH_COOKIE_TOKEN_PATTERN.test(nestedToken)
    ? nestedToken
    : undefined;
}

function extractPreAuthToken(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const data = payload as Record<string, unknown>;
  const direct = data.pre_auth_token;
  if (typeof direct === 'string' && AUTH_COOKIE_TOKEN_PATTERN.test(direct)) return direct;
  const nested = data.data;
  if (!nested || typeof nested !== 'object') return undefined;
  const nestedToken = (nested as Record<string, unknown>).pre_auth_token;
  return typeof nestedToken === 'string' && AUTH_COOKIE_TOKEN_PATTERN.test(nestedToken)
    ? nestedToken
    : undefined;
}

function extractPasswordResetHandoff(
  payload: unknown,
  expectedType: PasswordResetTokenType,
): PasswordResetHandoff | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const root = payload as Record<string, unknown>;
  const candidates = [root, root.data].filter(
    (candidate): candidate is Record<string, unknown> =>
      Boolean(candidate) && typeof candidate === 'object' && !Array.isArray(candidate),
  );

  for (const candidate of candidates) {
    if (
      candidate.token_type !== expectedType ||
      typeof candidate.token !== 'string' ||
      !PASSWORD_RESET_TOKEN_PATTERN.test(candidate.token)
    ) {
      continue;
    }
    const rawTtl = candidate.expires_in_seconds;
    const expiresInSeconds =
      typeof rawTtl === 'number' && Number.isFinite(rawTtl) && rawTtl > 0
        ? Math.min(PASSWORD_RESET_TOKEN_MAX_AGE, Math.floor(rawTtl))
        : 5 * 60;
    return { token: candidate.token, expiresInSeconds };
  }
  return null;
}

function redactAuthTokens(payload: unknown): unknown {
  if (Array.isArray(payload)) return payload.map(redactAuthTokens);
  if (!payload || typeof payload !== 'object') return payload;

  return Object.fromEntries(
    Object.entries(payload as Record<string, unknown>)
      .filter(
        ([key]) =>
          ![
            'access_token',
            'refresh_token',
            'id_token',
            'pre_auth_token',
            'token',
            'reset_token',
            'confirm_token',
          ].includes(key),
      )
      .map(([key, value]) => [key, redactAuthTokens(value)])
  );
}

function appendPasswordResetCookieDeletion(
  headers: Headers,
  kind: 'password-reset' | 'password-reset-confirm',
  secure: boolean,
): void {
  headers.append('Set-Cookie', serializeAuthCookie(kind, '', 0, secure));
}

function passwordResetSessionClearedResponse(request: NextRequest): NextResponse {
  const headers = new Headers({
    'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
  });
  const secure = isSecureRequest(request);
  appendPasswordResetCookieDeletion(headers, 'password-reset', secure);
  appendPasswordResetCookieDeletion(headers, 'password-reset-confirm', secure);
  return NextResponse.json({ cleared: true }, { status: 200, headers });
}

function appendLocalSessionDeletions(headers: Headers, secure: boolean): void {
  headers.append('Set-Cookie', serializeAuthCookie('access', '', 0, secure));
  headers.append('Set-Cookie', serializeAuthCookie('refresh', '', 0, secure));
  headers.append('Set-Cookie', serializeAuthCookie('preauth', '', 0, secure));
  appendPasswordResetCookieDeletion(headers, 'password-reset', secure);
  appendPasswordResetCookieDeletion(headers, 'password-reset-confirm', secure);
  for (const deletion of legacyAuthCookieDeletions(secure)) {
    headers.append('Set-Cookie', deletion);
  }
}

function localLogoutResponse(request: NextRequest): NextResponse {
  const headers = noStoreHeaders();
  appendLocalSessionDeletions(headers, isSecureRequest(request));
  return NextResponse.json({ logged_out: true }, { status: 200, headers });
}

function readLogoutRefreshToken(request: NextRequest): string | undefined {
  const currentToken = readAuthCookie(request, 'refresh');
  if (currentToken) return currentToken;

  // Durante il rollout il browser puo' avere ancora il precedente cookie con
  // Domain parent. Lo usiamo soltanto per revocarlo e lo cancelliamo comunque.
  const legacyToken = request.cookies.get(LEGACY_REFRESH_COOKIE_NAME)?.value?.trim();
  return legacyToken || undefined;
}

async function revokeRefreshSessionBestEffort(
  request: NextRequest,
  refreshToken: string | undefined,
  authorization: string | undefined,
): Promise<void> {
  if (
    !AUTH_API_URL ||
    !refreshToken ||
    !AUTH_COOKIE_TOKEN_PATTERN.test(refreshToken)
  ) {
    return;
  }

  try {
    const rateLimit = await checkRateLimit(request, {
      scope: 'auth:logout-revoke',
      ...authRateLimit('logout'),
    });
    if (!rateLimit.allowed) return;
  } catch {
    // Se il limiter non e' disponibile saltiamo la chiamata remota, ma la
    // cancellazione locale preparata dal chiamante resta sempre valida.
    return;
  }

  try {
    const response = await fetchWithBodyDeadline(
      new URL('/api/auth/logout', AUTH_API_URL).toString(),
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'identity',
          'Content-Type': 'application/json',
          ...(authorization ? { Authorization: authorization } : {}),
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: 'no-store',
        next: { revalidate: 0 },
        redirect: 'error',
      },
      LOGOUT_REVOCATION_TIMEOUT_MS,
    );
    await response.body?.cancel();
  } catch {
    // La revoca remota e' best-effort: il logout locale non deve dipendere
    // dalla disponibilita' del servizio auth e non logga mai il token.
  }
}

function withAuthenticatedFlag(payload: unknown, authenticated: boolean): unknown {
  const redacted = redactAuthTokens(payload);
  if (!authenticated || !redacted || typeof redacted !== 'object' || Array.isArray(redacted)) {
    return redacted;
  }
  return { ...(redacted as Record<string, unknown>), authenticated: true };
}

function authRateLimit(path: string): { limit: number; windowMs: number } {
  if (path === 'login' || path === 'login/code/verify' || path === 'verify-mfa') {
    return { limit: 10, windowMs: 5 * 60_000 };
  }
  if (
    path.includes('request') ||
    path === 'resend-verification' ||
    path === 'register'
  ) {
    return { limit: 5, windowMs: 15 * 60_000 };
  }
  return { limit: 30, windowMs: 5 * 60_000 };
}

function scopedInternalHeaders(path: string): Record<string, string> {
  if (!PUBLIC_USER_EXACT_ROUTES.has(path)) return {};
  if (
    !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(AUTH_INTERNAL_CALLER) ||
    Buffer.byteLength(AUTH_INTERNAL_CALLER_TOKEN, 'utf8') < 32 ||
    AUTH_INTERNAL_CALLER_TOKEN.length > 4096
  ) {
    return {};
  }
  return {
    'X-Internal-Caller': AUTH_INTERNAL_CALLER,
    'X-Internal-Token': AUTH_INTERNAL_CALLER_TOKEN,
  };
}

function extractExpiresIn(payload: unknown): number {
  if (!payload || typeof payload !== 'object') return DEFAULT_ACCESS_TOKEN_MAX_AGE;
  const data = payload as Record<string, unknown>;

  const direct = data.expires_in;
  if (typeof direct === 'number' && Number.isFinite(direct) && direct > 0) {
    return Math.min(DEFAULT_ACCESS_TOKEN_MAX_AGE, Math.floor(direct));
  }

  const nested = data.data;
  if (!nested || typeof nested !== 'object') return DEFAULT_ACCESS_TOKEN_MAX_AGE;
  const nestedExpires = (nested as Record<string, unknown>).expires_in;
  if (typeof nestedExpires === 'number' && Number.isFinite(nestedExpires) && nestedExpires > 0) {
    return Math.min(DEFAULT_ACCESS_TOKEN_MAX_AGE, Math.floor(nestedExpires));
  }

  return DEFAULT_ACCESS_TOKEN_MAX_AGE;
}

async function proxy(request: NextRequest, pathSegments: string[]) {
  if (!isAllowedPath(pathSegments, request.method)) {
    return NextResponse.json(
      { detail: 'Not found' },
      { status: 404, headers: noStoreHeaders() }
    );
  }

  const path = pathSegments.join('/');
  const originViolation = enforceSameOrigin(request);
  if (originViolation) return originViolation;

  if (path === 'logout') {
    // Prepariamo prima la risposta che invalida ogni sessione browser. La
    // revoca remota resta limitata e best-effort; solo quella passa dal rate
    // limiter, la cui indisponibilita' non puo' bloccare la sessione locale.
    const response = localLogoutResponse(request);
    await revokeRefreshSessionBestEffort(
      request,
      readLogoutRefreshToken(request),
      getForwardedAuthorization(request),
    );
    return response;
  }

  if (path === 'password/reset/clear-session') {
    return passwordResetSessionClearedResponse(request);
  }

  if (!AUTH_API_URL) {
    return NextResponse.json(
      { detail: 'Authentication service unavailable' },
      { status: 503, headers: noStoreHeaders() }
    );
  }

  const authLimit = authRateLimit(path);
  const rateLimit = await checkRateLimit(request, {
    // Username routes are dynamic: never place the username in Redis keys and
    // do not grant a fresh scraping quota for every requested profile.
    scope: path.startsWith('users/') ? 'auth:users-public' : `auth:${path}`,
    ...authLimit,
  });
  if (!rateLimit.allowed) return rateLimitExceededResponse(rateLimit);

  const targetPath = `/api/auth${path ? `/${path}` : ''}`;
  const url = new URL(targetPath, AUTH_API_URL);
  if (!appendQueryWithPolicy(url, request.nextUrl, authQueryRules(path), {
    maxBytes: 4_096,
    maxValueBytes: 3_700,
  })) {
    return NextResponse.json(
      { detail: 'Invalid query parameters' },
      { status: 400, headers: { 'Cache-Control': 'private, no-store, max-age=0' } },
    );
  }

  const auth = getForwardedAuthorization(request);
  const rawIdempotencyKey = request.headers.get('idempotency-key');
  const idempotencyKey =
    rawIdempotencyKey && /^[A-Za-z0-9._:-]{8,128}$/.test(rawIdempotencyKey)
      ? rawIdempotencyKey
      : null;
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
    'Accept-Encoding': 'identity',
    'Content-Type': 'application/json',
    ...(auth ? { Authorization: auth } : {}),
    ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    ...(trustedDeviceCookie ? { Cookie: trustedDeviceCookie } : {}),
    ...(userAgent ? { 'User-Agent': userAgent } : {}),
    ...scopedInternalHeaders(path),
  };
  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    if (path === 'refresh') {
      const refreshToken = readAuthCookie(request, 'refresh');
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
      let bodyResult;
      try {
        bodyResult = await readTextBodyWithLimit(request, MAX_AUTH_BODY_BYTES);
      } catch (error) {
        const timedOut = error instanceof RequestBodyTimeoutError;
        return NextResponse.json(
          { detail: timedOut ? 'Request body timed out' : 'Invalid request body' },
          {
            status: timedOut ? 408 : 400,
            headers: {
              'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
            },
          },
        );
      }
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
      if (path === 'verify-mfa') {
        const preAuthToken = readAuthCookie(request, 'preauth');
        if (!preAuthToken) {
          return NextResponse.json(
            { detail: 'MFA session unavailable' },
            {
              status: 401,
              headers: {
                'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
              },
            },
          );
        }
        try {
          const parsedBody = JSON.parse(body || '{}') as unknown;
          if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
            throw new Error('invalid body');
          }
          const safeBody = parsedBody as Record<string, unknown>;
          delete safeBody.pre_auth_token;
          body = JSON.stringify({ ...safeBody, pre_auth_token: preAuthToken });
        } catch {
          return NextResponse.json(
            { detail: 'Invalid request' },
            {
              status: 400,
              headers: {
                'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
              },
            },
          );
        }
      }
      if (
        path === 'password/reset/confirm-init' ||
        path === 'password/reset/confirm-final'
      ) {
        const isConfirmInit = path === 'password/reset/confirm-init';
        const cookieKind = isConfirmInit
          ? 'password-reset'
          : 'password-reset-confirm';
        const handoffToken = readAuthCookie(request, cookieKind);
        if (!handoffToken || !PASSWORD_RESET_TOKEN_PATTERN.test(handoffToken)) {
          return NextResponse.json(
            { detail: 'Password reset session unavailable' },
            {
              status: 401,
              headers: {
                'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
              },
            },
          );
        }
        try {
          const parsedBody = JSON.parse(body || '{}') as unknown;
          if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
            throw new Error('invalid body');
          }
          const submitted = parsedBody as Record<string, unknown>;
          if (isConfirmInit) {
            body = JSON.stringify({
              reset_token: handoffToken,
              new_password: submitted.new_password,
            });
          } else {
            body = JSON.stringify({
              confirm_token: handoffToken,
              code: submitted.code,
            });
          }
          // Explicit assignment above is intentional: attacker-supplied token
          // fields and every unrelated field are ignored at the BFF boundary.
        } catch {
          return NextResponse.json(
            { detail: 'Invalid request' },
            {
              status: 400,
              headers: {
                'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
              },
            },
          );
        }
      }
      if (body) {
        headers['Content-Type'] = 'application/json';
      }
    }
  }

  try {
    const res = await fetchWithBodyDeadline(url.toString(), {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
      next: { revalidate: 0 },
      redirect: 'error',
    }, 15_000);
    
    const data = await readJsonResponseWithLimit(res, MAX_AUTH_RESPONSE_BYTES);

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

    // Token responses are accepted only from endpoints whose contract can
    // legitimately issue them. This prevents cross-route response confusion.
    const accessToken = ACCESS_TOKEN_RESPONSE_PATHS.has(path)
      ? extractAccessToken(data)
      : undefined;
    const preAuthToken = PREAUTH_TOKEN_RESPONSE_PATHS.has(path)
      ? extractPreAuthToken(data)
      : undefined;
    const isSecure = isSecureRequest(request);
    let browserPayload: unknown = withAuthenticatedFlag(
      data,
      Boolean(accessToken) && res.ok,
    );

    if (path === 'password/reset/request') {
      appendPasswordResetCookieDeletion(responseHeaders, 'password-reset', isSecure);
      appendPasswordResetCookieDeletion(
        responseHeaders,
        'password-reset-confirm',
        isSecure,
      );
      browserPayload = res.ok
        ? { accepted: true }
        : { detail: 'Password reset request failed' };
    } else if (path === 'password/reset/verify-code') {
      appendPasswordResetCookieDeletion(
        responseHeaders,
        'password-reset-confirm',
        isSecure,
      );
      if (res.ok) {
        const handoff = extractPasswordResetHandoff(data, 'password_reset');
        if (!handoff) {
          appendPasswordResetCookieDeletion(responseHeaders, 'password-reset', isSecure);
          return NextResponse.json(
            { detail: 'Authentication service unavailable' },
            { status: 502, headers: responseHeaders },
          );
        }
        responseHeaders.append(
          'Set-Cookie',
          serializeAuthCookie(
            'password-reset',
            handoff.token,
            handoff.expiresInSeconds,
            isSecure,
          ),
        );
        browserPayload = {
          handoff_ready: true,
          expires_in_seconds: handoff.expiresInSeconds,
        };
      } else {
        appendPasswordResetCookieDeletion(responseHeaders, 'password-reset', isSecure);
        browserPayload = { detail: 'Password reset verification failed' };
      }
    } else if (path === 'password/reset/confirm-init') {
      if (res.ok) {
        const handoff = extractPasswordResetHandoff(data, 'password_reset_confirm');
        if (!handoff) {
          appendPasswordResetCookieDeletion(responseHeaders, 'password-reset', isSecure);
          appendPasswordResetCookieDeletion(
            responseHeaders,
            'password-reset-confirm',
            isSecure,
          );
          return NextResponse.json(
            { detail: 'Authentication service unavailable' },
            { status: 502, headers: responseHeaders },
          );
        }
        appendPasswordResetCookieDeletion(responseHeaders, 'password-reset', isSecure);
        responseHeaders.append(
          'Set-Cookie',
          serializeAuthCookie(
            'password-reset-confirm',
            handoff.token,
            handoff.expiresInSeconds,
            isSecure,
          ),
        );
        browserPayload = {
          handoff_ready: true,
          expires_in_seconds: handoff.expiresInSeconds,
        };
      } else {
        browserPayload = { detail: 'Password reset confirmation failed' };
      }
    } else if (path === 'password/reset/confirm-final') {
      if (res.ok) {
        appendPasswordResetCookieDeletion(responseHeaders, 'password-reset', isSecure);
        appendPasswordResetCookieDeletion(
          responseHeaders,
          'password-reset-confirm',
          isSecure,
        );
        browserPayload = { completed: true };
      } else {
        // Keep the HttpOnly confirm cookie for bounded OTP2 retries.
        browserPayload = { detail: 'Password reset confirmation failed' };
      }
    }

    if (path === 'login' || path === 'login/code/verify') {
      responseHeaders.append(
        'Set-Cookie',
        serializeAuthCookie('preauth', '', 0, isSecure),
      );
    }
    if (preAuthToken && res.ok) {
      responseHeaders.append(
        'Set-Cookie',
        serializeAuthCookie('preauth', preAuthToken, PREAUTH_TOKEN_MAX_AGE, isSecure),
      );
    }

    if (accessToken && res.ok) {
      const maxAge = extractExpiresIn(data);
      responseHeaders.append(
        'Set-Cookie',
        serializeAuthCookie('access', accessToken, maxAge, isSecure)
      );
      const refreshToken = extractRefreshToken(data);
      if (refreshToken) {
        responseHeaders.append(
          'Set-Cookie',
          serializeAuthCookie('refresh', refreshToken, REFRESH_TOKEN_MAX_AGE, isSecure)
        );
      }
      for (const deletion of legacyAuthCookieDeletions(isSecure)) {
        responseHeaders.append('Set-Cookie', deletion);
      }
      responseHeaders.append(
        'Set-Cookie',
        serializeAuthCookie('preauth', '', 0, isSecure),
      );
      appendPasswordResetCookieDeletion(responseHeaders, 'password-reset', isSecure);
      appendPasswordResetCookieDeletion(
        responseHeaders,
        'password-reset-confirm',
        isSecure,
      );
    }

    return NextResponse.json(browserPayload, {
      status: res.status,
      headers: responseHeaders,
    });
    
  } catch (err) {
    console.error(
      '[auth proxy] forwarding failed',
      err instanceof Error ? err.name : 'UnknownError',
    );
    // Dettaglio dell'errore solo nei log server (sopra); al client messaggio generico.
    const isTimeout = err instanceof DOMException && err.name === 'AbortError';
    return NextResponse.json(
      { detail: isTimeout ? 'Request timed out' : 'Authentication service unavailable' },
      { status: 502, headers: noStoreHeaders() }
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
