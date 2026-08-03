/**
 * Proxy /api/saved-auctions/* → AUCTION_API_URL/saved-auctions/*
 * Sicurezza: cookie-first, 401 fail-closed, no-store, rate limit, timeout.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getForwardedAuthorization, extractUserIdForRateLimit } from '@/app/api/_lib/forwarded-authorization';
import { noStoreHeaders, redactedUpstreamErrorResponse, unauthorizedResponse } from '@/app/api/_lib/proxy-response';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';
import { normalizeProxyPathSegments } from '@/app/api/_lib/safe-proxy-path';
import { isAllowedAuctionProxyPath } from '@/app/api/_lib/auction-proxy-policy';
import { enforceSameOrigin } from '@/app/api/_lib/request-security';
import { readTextBodyWithLimit } from '@/app/api/_lib/request-body';
import { readJsonResponseWithLimit } from '@/app/api/_lib/bounded-json-response';
import { trustedAuctionServiceOrigin } from '@/app/api/_lib/upstream-url';
import { fetchWithBodyDeadline } from '@/app/api/_lib/upstream-fetch';
import { getAuctionApiUrlEnv } from '@/lib/server-runtime-env';
import { appendQueryWithPolicy, QUERY_INTEGER, QUERY_POSITIVE_INTEGER, type QueryRules } from '@/app/api/_lib/query-policy';

export const dynamic = 'force-dynamic';

const PROXY_TIMEOUT_MS = 12_000;
const MAX_PROXY_BODY_BYTES = 64 * 1024;
const MAX_PROXY_RESPONSE_BYTES = 1024 * 1024;

const AUCTION_API_URL = trustedAuctionServiceOrigin(
  getAuctionApiUrlEnv()
);

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
  if (!AUCTION_API_URL) {
    return NextResponse.json(
      { detail: 'Servizio aste salvate non disponibile' },
      { status: 503, headers: noStoreHeaders() }
    );
  }

  const path = normalizeProxyPathSegments(pathSegments);
  if (path === null) {
    return NextResponse.json({ detail: 'Percorso non valido' }, { status: 400, headers: noStoreHeaders() });
  }
  if (!isAllowedAuctionProxyPath('saved-auctions', request.method, path)) {
    return NextResponse.json({ detail: 'Not found' }, { status: 404, headers: noStoreHeaders() });
  }
  const originViolation = enforceSameOrigin(request);
  if (originViolation) return originViolation;

  const auth = getForwardedAuthorization(request);
  if (!auth) return unauthorizedResponse();

  const userId = extractUserIdForRateLimit(auth);
  const rl = await checkRateLimit(request, { scope: 'saved-auctions', limit: 60, windowMs: 60_000, userId });
  if (!rl.allowed) return rateLimitExceededResponse(rl);

  const targetPath = `/saved-auctions${path ? `/${path}` : ''}`;
  const url = new URL(targetPath, AUCTION_API_URL);
  const queryRules: QueryRules = request.method === 'GET' && path === 'me'
    ? { limit: QUERY_POSITIVE_INTEGER, offset: QUERY_INTEGER }
    : {};
  if (!appendQueryWithPolicy(url, request.nextUrl, queryRules)) {
    return NextResponse.json({ detail: 'Invalid query parameters' }, { status: 400, headers: noStoreHeaders() });
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: auth,
  };

  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const bodyResult = await readTextBodyWithLimit(request, MAX_PROXY_BODY_BYTES);
    if (bodyResult.tooLarge) {
      return NextResponse.json({ detail: 'Request body too large' }, { status: 413, headers: noStoreHeaders() });
    }
    body = bodyResult.body;
    if (body) headers['Content-Type'] = request.headers.get('content-type') || 'application/json';
  }

  try {
    const res = await fetchWithTimeout(url.toString(), { method: request.method, headers, body }, PROXY_TIMEOUT_MS);
    if (!res.ok) return redactedUpstreamErrorResponse(res.status, 'Operazione asta salvata non riuscita');
    const data = await readJsonResponseWithLimit(res, MAX_PROXY_RESPONSE_BYTES);
    return NextResponse.json(data, { status: res.status, headers: noStoreHeaders() });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    if (!isTimeout) console.error('[saved-auctions proxy] fetch error');
    return NextResponse.json(
      { detail: isTimeout ? 'Timeout: saved-auctions service non ha risposto.' : 'Saved auctions proxy request failed' },
      { status: isTimeout ? 504 : 502, headers: noStoreHeaders() }
    );
  }
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function withParams(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function GET(request: NextRequest, context: RouteContext) {
  return withParams(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return withParams(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return withParams(request, context);
}
