/**
 * Proxy to BRX Sync microservice.
 * Browser calls same-origin /api/sync/... (correct); this route forwards to the Sync backend.
 * Use SYNC_API_URL for server-side (runtime on Amplify). NEXT_PUBLIC_* is for client/build.
 *
 * NOTA: non esiste un rewrite /api/sync/* in next.config.mjs. Il rewrite bypasserebbe
 * questo route handler e i suoi controlli di sicurezza. Il routing passa esclusivamente
 * da qui.
 *
 * Sicurezza: cookie-first, 401 fail-closed, no-store, rate limit, timeout.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getForwardedAuthorization, extractUserIdForRateLimit } from '@/app/api/_lib/forwarded-authorization';
import { noStoreHeaders, unauthorizedResponse } from '@/app/api/_lib/proxy-response';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';
import { readTextBodyWithLimit } from '@/app/api/_lib/request-body';
import { enforceSameOrigin } from '@/app/api/_lib/request-security';
import { normalizeProxyPathSegments } from '@/app/api/_lib/safe-proxy-path';
import { readJsonResponseWithLimit } from '@/app/api/_lib/bounded-json-response';
import { trustedSyncServiceOrigin } from '@/app/api/_lib/upstream-url';
import { fetchWithBodyDeadline } from '@/app/api/_lib/upstream-fetch';
import { appendQueryWithPolicy, QUERY_INTEGER, QUERY_POSITIVE_INTEGER, type QueryRules } from '@/app/api/_lib/query-policy';
import { getSyncApiUrlEnv } from '@/lib/server-runtime-env';

const PROXY_TIMEOUT_MS = 12_000;
const MAX_SYNC_BODY_BYTES = 256 * 1024;
const MAX_SYNC_RESPONSE_BYTES = 2 * 1024 * 1024;
const SEGMENT = '[A-Za-z0-9._~%-]{1,160}';
const INTEGER = '[1-9][0-9]{0,18}';

function isAllowedSyncPath(path: string, method: string): boolean {
  const rules: ReadonlyArray<[string, RegExp]> = [
    ['GET', new RegExp(`^status/${SEGMENT}$`)],
    ['POST', new RegExp(`^disconnect/${SEGMENT}$`)],
    ['GET', new RegExp(`^webhook-url/${SEGMENT}$`)],
    ['POST', /^link-cardtrader$/],
    ['POST', new RegExp(`^start/${SEGMENT}$`)],
    ['POST', new RegExp(`^sync-from-cardtrader/${SEGMENT}$`)],
    ['GET', new RegExp(`^progress/${SEGMENT}$`)],
    ['GET', new RegExp(`^inventory/${SEGMENT}$`)],
    ['GET', new RegExp(`^task/${SEGMENT}$`)],
    ['PUT', new RegExp(`^inventory/${SEGMENT}/item/${INTEGER}$`)],
    ['DELETE', new RegExp(`^inventory/${SEGMENT}/item/${INTEGER}$`)],
  ];
  return rules.some(([allowedMethod, pattern]) => allowedMethod === method && pattern.test(path));
}

function getSyncApiUrl(): string {
  return trustedSyncServiceOrigin(getSyncApiUrlEnv());
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('Accept-Encoding', 'identity');
  return fetchWithBodyDeadline(url, {
    ...init,
    headers,
    cache: 'no-store',
    redirect: 'error',
  }, timeoutMs);
}

async function proxy(request: NextRequest, pathSegments: string[]) {
  const path = normalizeProxyPathSegments(pathSegments);
  if (path === null) {
    return NextResponse.json(
      { detail: 'Percorso sync non valido' },
      { status: 400, headers: noStoreHeaders() }
    );
  }

  if (!isAllowedSyncPath(path, request.method)) {
    return NextResponse.json(
      { detail: 'Not found' },
      { status: 404, headers: noStoreHeaders() },
    );
  }

  const originViolation = enforceSameOrigin(request);
  if (originViolation) return originViolation;

  const auth = getForwardedAuthorization(request);
  if (!auth) return unauthorizedResponse();

  const SYNC_API_URL = getSyncApiUrl();
  if (!SYNC_API_URL) {
    return NextResponse.json(
      { detail: 'Servizio sync non disponibile' },
      { status: 503, headers: noStoreHeaders() }
    );
  }

  const userId = extractUserIdForRateLimit(auth);
  const rl = await checkRateLimit(request, { scope: 'sync', limit: 30, windowMs: 60_000, userId });
  if (!rl.allowed) return rateLimitExceededResponse(rl);

  const targetPath = `/api/v1/sync${path ? `/${path}` : ''}`;
  const url = new URL(targetPath, SYNC_API_URL);
  const queryRules: QueryRules =
    request.method === 'GET' && /^inventory\//.test(path)
      ? { limit: QUERY_POSITIVE_INTEGER, offset: QUERY_INTEGER }
      : {};
  if (!appendQueryWithPolicy(url, request.nextUrl, queryRules)) {
    return NextResponse.json(
      { detail: 'Invalid query parameters' },
      { status: 400, headers: noStoreHeaders() },
    );
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: auth,
  };

  let body: string | undefined;
  const contentType = request.headers.get('content-type');
  if (request.method !== 'GET' && request.method !== 'HEAD' && contentType?.includes('application/json')) {
    const bodyResult = await readTextBodyWithLimit(request, MAX_SYNC_BODY_BYTES);
    if (bodyResult.tooLarge) {
      return NextResponse.json(
        { detail: 'Request body too large' },
        { status: 413, headers: noStoreHeaders() },
      );
    }
    body = bodyResult.body;
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetchWithTimeout(url.toString(), { method: request.method, headers, body }, PROXY_TIMEOUT_MS);
    if (!res.ok) {
      let upstreamDetail: string | undefined;
      try {
        const errJson = await readJsonResponseWithLimit(res, 64 * 1024);
        if (errJson && typeof errJson === 'object') {
          const record = errJson as Record<string, unknown>;
          if (typeof record.detail === 'string' && record.detail.trim()) {
            upstreamDetail = record.detail.trim();
          } else if (typeof record.message === 'string' && record.message.trim()) {
            upstreamDetail = record.message.trim();
          }
        }
      } catch {
        /* Non-JSON or error reading body */
      }

      const status = res.status >= 500 ? 502 : res.status;
      const detail =
        upstreamDetail ||
        (res.status === 401
          ? 'Autenticazione richiesta'
          : res.status === 403
            ? 'Permessi insufficienti'
            : res.status === 404
              ? 'Risorsa non trovata'
              : res.status === 409
                ? 'Operazione in conflitto'
                : res.status === 422
                  ? 'Dati richiesta non validi'
                  : 'Operazione sync non riuscita');
      return NextResponse.json({ detail }, { status, headers: noStoreHeaders() });
    }
    const data = await readJsonResponseWithLimit(res, MAX_SYNC_RESPONSE_BYTES);
    return NextResponse.json(data, { status: res.status, headers: noStoreHeaders() });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    if (!isTimeout) console.error('[sync proxy] fetch error');
    return NextResponse.json(
      { detail: isTimeout ? 'Timeout: sync service non ha risposto.' : 'Proxy request failed' },
      { status: isTimeout ? 504 : 502, headers: noStoreHeaders() }
    );
  }
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}
