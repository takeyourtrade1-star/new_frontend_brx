import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { readAuthCookie } from '@/app/api/_lib/auth-cookies';
import { readJsonResponseWithLimit } from '@/app/api/_lib/bounded-json-response';
import { noStoreHeaders } from '@/app/api/_lib/proxy-response';
import { checkRateLimit } from '@/app/api/_lib/rate-limit';
import { fetchWithBodyDeadline } from '@/app/api/_lib/upstream-fetch';
import { trustedAuthServiceOrigin } from '@/app/api/_lib/upstream-url';
import {
  TOURNAMENTS_SSO_CALLBACK_URL,
} from '@/lib/config/tournaments';
import { getAuthApiUrlEnv } from '@/lib/server-runtime-env';

export const dynamic = 'force-dynamic';

const MARKETPLACE_CLIENT_ID = 'marketplace';
const TARGET_CLIENT_ID = 'tournaments';
const MAX_QUERY_BYTES = 2_048;
const MAX_AUTH_RESPONSE_BYTES = 16 * 1_024;
const AUTH_TIMEOUT_MS = 10_000;
const COOKIE_TOKEN_PATTERN = /^[A-Za-z0-9._~-]{1,3800}$/;
const CLIENT_SECRET_PATTERN = /^[A-Za-z0-9._~-]{32,256}$/;
const BASE64URL_43_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const QUERY_KEYS = [
  'client_id',
  'redirect_uri',
  'state',
  'code_challenge',
  'code_challenge_method',
] as const;

const authorizeQuerySchema = z.object({
  client_id: z.literal(TARGET_CLIENT_ID),
  redirect_uri: z.literal(TOURNAMENTS_SSO_CALLBACK_URL),
  state: z.string().regex(BASE64URL_43_PATTERN),
  code_challenge: z.string().regex(BASE64URL_43_PATTERN),
  code_challenge_method: z.literal('S256'),
}).strict();

type AuthorizeQuery = z.infer<typeof authorizeQuerySchema>;

function hardenRedirect(response: NextResponse): NextResponse {
  const headers = noStoreHeaders(response.headers);
  headers.set('Pragma', 'no-cache');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  for (const [name, value] of headers) response.headers.set(name, value);
  return response;
}

function callbackRedirect(error: string, state?: string): NextResponse {
  const url = new URL(TOURNAMENTS_SSO_CALLBACK_URL);
  url.searchParams.set('error', error);
  if (BASE64URL_43_PATTERN.test(state ?? '')) url.searchParams.set('state', state!);
  return hardenRedirect(NextResponse.redirect(url));
}

function parseAuthorizeQuery(request: NextRequest): AuthorizeQuery | null {
  if (Buffer.byteLength(request.nextUrl.search, 'utf8') > MAX_QUERY_BYTES) return null;
  const expectedKeys = new Set<string>(QUERY_KEYS);
  for (const key of request.nextUrl.searchParams.keys()) {
    if (!expectedKeys.has(key) || request.nextUrl.searchParams.getAll(key).length !== 1) {
      return null;
    }
  }
  if (Array.from(expectedKeys).some((key) => !request.nextUrl.searchParams.has(key))) {
    return null;
  }
  const parsed = authorizeQuerySchema.safeParse(
    Object.fromEntries(QUERY_KEYS.map((key) => [key, request.nextUrl.searchParams.get(key)])),
  );
  return parsed.success ? parsed.data : null;
}

function isTopLevelNavigation(request: NextRequest): boolean {
  const mode = request.headers.get('sec-fetch-mode')?.toLowerCase();
  const destination = request.headers.get('sec-fetch-dest')?.toLowerCase();
  if (mode && mode !== 'navigate') return false;
  return !destination || destination === 'document';
}

function validAuthorizationCode(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;
  return (
    typeof record.code === 'string' &&
    /^[A-Za-z0-9_-]{43,128}$/.test(record.code) &&
    typeof record.expires_in === 'number' &&
    Number.isSafeInteger(record.expires_in) &&
    record.expires_in >= 30 &&
    record.expires_in <= 120
  ) ? record.code : null;
}

/** Autorizza un handoff first-party usando soltanto la sessione HttpOnly locale. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const state = request.nextUrl.searchParams.get('state') ?? undefined;
  const query = parseAuthorizeQuery(request);
  if (!query || !isTopLevelNavigation(request)) {
    return callbackRedirect('invalid_request', state);
  }

  const limit = await checkRateLimit(request, {
    scope: 'auth:sso-authorize',
    limit: 10,
    windowMs: 5 * 60_000,
  });
  if (!limit.allowed) return callbackRedirect('temporarily_unavailable', query.state);

  const refreshToken = readAuthCookie(request, 'refresh');
  if (!refreshToken || !COOKIE_TOKEN_PATTERN.test(refreshToken)) {
    return callbackRedirect('login_required', query.state);
  }

  const clientSecret = process.env.SSO_MARKETPLACE_CLIENT_SECRET?.trim() ?? '';
  const authOrigin = trustedAuthServiceOrigin(getAuthApiUrlEnv());
  if (
    process.env.SSO_HANDOFF_ENABLED !== 'true' ||
    !CLIENT_SECRET_PATTERN.test(clientSecret) ||
    !authOrigin
  ) {
    return callbackRedirect('temporarily_unavailable', query.state);
  }

  try {
    const upstream = await fetchWithBodyDeadline(
      new URL('/api/auth/sso/authorize', authOrigin),
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'identity',
          'Content-Type': 'application/json',
          'X-SSO-Client-ID': MARKETPLACE_CLIENT_ID,
          'X-SSO-Client-Secret': clientSecret,
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
          target_client_id: TARGET_CLIENT_ID,
          redirect_uri: query.redirect_uri,
          code_challenge: query.code_challenge,
          code_challenge_method: query.code_challenge_method,
        }),
        cache: 'no-store',
        redirect: 'error',
        signal: request.signal,
      },
      AUTH_TIMEOUT_MS,
    );
    if (
      !upstream.ok ||
      !upstream.headers.get('content-type')?.toLowerCase().startsWith('application/json')
    ) {
      await upstream.body?.cancel().catch(() => undefined);
      return callbackRedirect(
        upstream.status === 401 ? 'login_required' : 'temporarily_unavailable',
        query.state,
      );
    }

    const payload = await readJsonResponseWithLimit(upstream, MAX_AUTH_RESPONSE_BYTES);
    const code = validAuthorizationCode(payload);
    if (!code) return callbackRedirect('temporarily_unavailable', query.state);

    const callback = new URL(TOURNAMENTS_SSO_CALLBACK_URL);
    callback.searchParams.set('code', code);
    callback.searchParams.set('state', query.state);
    return hardenRedirect(NextResponse.redirect(callback));
  } catch {
    return callbackRedirect('temporarily_unavailable', query.state);
  }
}
