/**
 * Proxy root /api/notifications → AUCTION_API_URL/notifications
 * Sicurezza: cookie-first, 401 fail-closed, no-store, rate limit, timeout.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getForwardedAuthorization, extractUserIdForRateLimit } from '@/app/api/_lib/forwarded-authorization';
import { noStoreHeaders, redactedUpstreamErrorResponse, unauthorizedResponse } from '@/app/api/_lib/proxy-response';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';
import { readJsonResponseWithLimit } from '@/app/api/_lib/bounded-json-response';
import { trustedAuctionServiceOrigin } from '@/app/api/_lib/upstream-url';
import { fetchWithBodyDeadline } from '@/app/api/_lib/upstream-fetch';
import { getAuctionApiUrlEnv } from '@/lib/server-runtime-env';
import { appendQueryWithPolicy, QUERY_INTEGER, QUERY_POSITIVE_INTEGER } from '@/app/api/_lib/query-policy';

export const dynamic = 'force-dynamic';

const PROXY_TIMEOUT_MS = 12_000;
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

export async function GET(request: NextRequest) {
  if (!AUCTION_API_URL) {
    return NextResponse.json({ detail: 'Servizio notifiche non disponibile' }, { status: 503, headers: noStoreHeaders() });
  }

  const auth = getForwardedAuthorization(request);
  if (!auth) return unauthorizedResponse();

  const userId = extractUserIdForRateLimit(auth);
  const rl = await checkRateLimit(request, { scope: 'notifications', limit: 60, windowMs: 60_000, userId });
  if (!rl.allowed) return rateLimitExceededResponse(rl);

  const url = new URL('/notifications', AUCTION_API_URL);
  if (!appendQueryWithPolicy(url, request.nextUrl, {
    only_unread: /^(?:true|false)$/,
    limit: QUERY_POSITIVE_INTEGER,
    offset: QUERY_INTEGER,
  })) {
    return NextResponse.json({ detail: 'Invalid query parameters' }, { status: 400, headers: noStoreHeaders() });
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: auth,
  };

  try {
    const res = await fetchWithTimeout(url.toString(), { method: 'GET', headers }, PROXY_TIMEOUT_MS);
    if (!res.ok) return redactedUpstreamErrorResponse(res.status, 'Operazione notifiche non riuscita');
    const data = await readJsonResponseWithLimit(res, MAX_PROXY_RESPONSE_BYTES);
    return NextResponse.json(data, { status: res.status, headers: noStoreHeaders() });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    if (!isTimeout) console.error('[notifications proxy root] fetch error');
    return NextResponse.json(
      { detail: isTimeout ? 'Timeout: notifications service non ha risposto.' : 'Notifications proxy request failed' },
      { status: isTimeout ? 504 : 502, headers: noStoreHeaders() }
    );
  }
}
