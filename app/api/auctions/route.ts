/**
 * Proxy root /api/auctions → AUCTION_API_URL/auctions/
 * Handles list (GET) and create (POST) at the root level.
 * The [...path] catch-all does not match empty segments.
 *
 * Sicurezza: cookie-first, 401 fail-closed, no-store, rate limit, timeout.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getForwardedAuthorization, extractUserIdForRateLimit } from '@/app/api/_lib/forwarded-authorization';
import { noStoreHeaders, redactedUpstreamErrorResponse, unauthorizedResponse } from '@/app/api/_lib/proxy-response';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';
import { enforceSameOrigin } from '@/app/api/_lib/request-security';
import { readTextBodyWithLimit } from '@/app/api/_lib/request-body';
import { readJsonResponseWithLimit } from '@/app/api/_lib/bounded-json-response';
import { trustedAuctionServiceOrigin } from '@/app/api/_lib/upstream-url';
import { fetchWithBodyDeadline } from '@/app/api/_lib/upstream-fetch';
import { getAuctionApiUrlEnv } from '@/lib/server-runtime-env';
import { appendQueryWithPolicy, QUERY_INTEGER, QUERY_POSITIVE_INTEGER, type QueryRules } from '@/app/api/_lib/query-policy';
import type { AuctionStatus } from '@/types/auction';

export const dynamic = 'force-dynamic';

const PROXY_TIMEOUT_MS = 12_000;
const MAX_PROXY_BODY_BYTES = 256 * 1024;
const MAX_PROXY_RESPONSE_BYTES = 2 * 1024 * 1024;

type QueryableAuctionStatus = Exclude<AuctionStatus, 'UNKNOWN'>;

const AUCTION_STATUS_FILTERS = {
  DRAFT: true,
  ACTIVE: true,
  CLOSED: true,
} as const satisfies Record<QueryableAuctionStatus, true>;

function isAuctionStatusFilter(value: string): boolean {
  return Object.prototype.hasOwnProperty.call(AUCTION_STATUS_FILTERS, value);
}

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

async function proxy(request: NextRequest) {
  if (!AUCTION_API_URL) {
    return NextResponse.json(
      { detail: 'Servizio aste non disponibile' },
      { status: 503, headers: noStoreHeaders() }
    );
  }

  const auth = getForwardedAuthorization(request);
  const isGet = request.method === 'GET';
  if (!auth && !isGet) return unauthorizedResponse();
  const originViolation = enforceSameOrigin(request);
  if (originViolation) return originViolation;

  const userId = auth ? extractUserIdForRateLimit(auth) : undefined;
  const rl = await checkRateLimit(request, { scope: 'auctions', limit: 60, windowMs: 60_000, userId });
  if (!rl.allowed) return rateLimitExceededResponse(rl);

  const url = new URL('/auctions/', AUCTION_API_URL);
  const queryRules: QueryRules = isGet
    ? {
        q: (value: string) => value.length <= 100 && !/[\u0000-\u001f\u007f]/u.test(value),
        status: isAuctionStatusFilter,
        created_by_user_id: /^[A-Za-z0-9._~%-]{1,128}$/,
        limit: QUERY_POSITIVE_INTEGER,
        offset: QUERY_INTEGER,
      }
    : {};
  if (!appendQueryWithPolicy(url, request.nextUrl, queryRules)) {
    return NextResponse.json({ detail: 'Invalid query parameters' }, { status: 400, headers: noStoreHeaders() });
  }

  const idempotencyKey =
    request.headers.get('idempotency-key') ||
    request.headers.get('Idempotency-Key');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(auth ? { Authorization: auth } : {}),
    ...(idempotencyKey && /^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)
      ? { 'Idempotency-Key': idempotencyKey }
      : {}),
  };

  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const bodyResult = await readTextBodyWithLimit(request, MAX_PROXY_BODY_BYTES);
    if (bodyResult.tooLarge) {
      return NextResponse.json(
        { detail: 'Request body too large' },
        { status: 413, headers: noStoreHeaders() },
      );
    }
    body = bodyResult.body;
    if (body) headers['Content-Type'] = request.headers.get('content-type') || 'application/json';
  }

  try {
    const res = await fetchWithTimeout(url.toString(), { method: request.method, headers, body }, PROXY_TIMEOUT_MS);
    if (!res.ok) return redactedUpstreamErrorResponse(res.status, 'Operazione asta non riuscita');
    const data = await readJsonResponseWithLimit(res, MAX_PROXY_RESPONSE_BYTES);
    return NextResponse.json(data, { status: res.status, headers: noStoreHeaders() });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    if (!isTimeout) console.error('[auction proxy root] fetch error');
    return NextResponse.json(
      { detail: isTimeout ? 'Timeout: auction service non ha risposto.' : 'Auction proxy request failed' },
      { status: isTimeout ? 504 : 502, headers: noStoreHeaders() }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxy(request);
}

export async function POST(request: NextRequest) {
  return proxy(request);
}
