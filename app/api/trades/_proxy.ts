import { NextRequest, NextResponse } from 'next/server';
import {
  extractUserIdForRateLimit,
  getForwardedAuthorization,
} from '@/app/api/_lib/forwarded-authorization';
import { noStoreHeaders, unauthorizedResponse } from '@/app/api/_lib/proxy-response';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';

const PROXY_TIMEOUT_MS = 12_000;
const AUCTION_API_URL = (
  process.env.AUCTION_API_URL ||
  process.env.NEXT_PUBLIC_AUCTION_API_URL ||
  ''
).replace(/\/+$/, '');

export async function proxyTrade(request: NextRequest, pathSegments: string[]) {
  const auth = getForwardedAuthorization(request);
  if (!auth) return unauthorizedResponse();
  if (!AUCTION_API_URL) {
    return NextResponse.json(
      { detail: 'AUCTION_API_URL is not configured' },
      { status: 503, headers: noStoreHeaders() },
    );
  }
  const limit = checkRateLimit(request, {
    scope: 'trades',
    limit: 60,
    windowMs: 60_000,
    userId: extractUserIdForRateLimit(auth),
  });
  if (!limit.allowed) return rateLimitExceededResponse(limit);

  const path = pathSegments.join('/');
  const url = new URL(`/trades${path ? `/${path}` : ''}`, AUCTION_API_URL);
  request.nextUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value));
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': request.headers.get('content-type') || 'application/json',
    Authorization: auth,
  };
  const idempotencyKey = request.headers.get('idempotency-key');
  const requestId = request.headers.get('x-request-id');
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  if (requestId) headers['X-Request-ID'] = requestId;

  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') body = await request.text();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);
  try {
    const response = await fetch(url.toString(), {
      method: request.method,
      headers,
      body,
      signal: controller.signal,
      cache: 'no-store',
    });
    const data: unknown = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status, headers: noStoreHeaders() });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'AbortError';
    if (!timedOut) console.error('[trades proxy] fetch error');
    return NextResponse.json(
      { detail: timedOut ? 'Timeout: trades service non ha risposto.' : 'Trades proxy request failed' },
      { status: timedOut ? 504 : 502, headers: noStoreHeaders() },
    );
  } finally {
    clearTimeout(timeout);
  }
}
