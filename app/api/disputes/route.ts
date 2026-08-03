/**
 * Proxy root /api/disputes → AUCTION_API_URL/disputes
 * Sicurezza: cookie-first, 401 fail-closed, no-store, rate limit, timeout.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getForwardedAuthorization, extractUserIdForRateLimit } from '@/app/api/_lib/forwarded-authorization';
import { noStoreHeaders, redactedUpstreamErrorResponse, unauthorizedResponse } from '@/app/api/_lib/proxy-response';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';
import { readJsonResponseWithLimit } from '@/app/api/_lib/bounded-json-response';
import { trustedServiceOrigin } from '@/app/api/_lib/upstream-url';
import { fetchWithBodyDeadline } from '@/app/api/_lib/upstream-fetch';
import { appendQueryWithPolicy, QUERY_INTEGER, QUERY_POSITIVE_INTEGER } from '@/app/api/_lib/query-policy';

export const dynamic = 'force-dynamic';

const PROXY_TIMEOUT_MS = 12_000;
const MAX_PROXY_RESPONSE_BYTES = 2 * 1024 * 1024;

const AUCTION_API_URL = trustedServiceOrigin(
  process.env.AUCTION_API_URL
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

export async function GET(request: NextRequest) {
  if (!AUCTION_API_URL) {
    return NextResponse.json({ detail: 'Servizio contestazioni non disponibile' }, { status: 503, headers: noStoreHeaders() });
  }

  const auth = getForwardedAuthorization(request);
  if (!auth) return unauthorizedResponse();

  const userId = extractUserIdForRateLimit(auth);
  const rl = await checkRateLimit(request, { scope: 'disputes', limit: 30, windowMs: 60_000, userId });
  if (!rl.allowed) return rateLimitExceededResponse(rl);

  const url = new URL('/disputes', AUCTION_API_URL);
  if (!appendQueryWithPolicy(url, request.nextUrl, {
    status: /^[a-z_]{1,32}(?:,[a-z_]{1,32})*$/,
    limit: QUERY_POSITIVE_INTEGER,
    offset: QUERY_INTEGER,
  })) {
    return NextResponse.json({ detail: 'Invalid query parameters' }, { status: 400, headers: noStoreHeaders() });
  }

  try {
    const res = await fetchWithTimeout(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: auth },
    }, PROXY_TIMEOUT_MS);
    if (!res.ok) return redactedUpstreamErrorResponse(res.status, 'Operazione contestazione non riuscita');
    const data = await readJsonResponseWithLimit(res, MAX_PROXY_RESPONSE_BYTES);
    return NextResponse.json(data, { status: res.status, headers: noStoreHeaders() });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    if (!isTimeout) console.error('[disputes proxy root] fetch error');
    return NextResponse.json(
      { detail: isTimeout ? 'Timeout: disputes service non ha risposto.' : 'Disputes proxy request failed' },
      { status: isTimeout ? 504 : 502, headers: noStoreHeaders() }
    );
  }
}
