/**
 * Proxy root /api/notifications → NOTIFICATIONS_API_URL/notifications.
 * Falls back to AUCTION_API_URL while the notification hub lives there.
 * Sicurezza: cookie-first, 401 fail-closed, no-store, rate limit, timeout.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getForwardedAuthorization, extractUserIdForRateLimit } from '@/app/api/_lib/forwarded-authorization';
import { noStoreHeaders, unauthorizedResponse } from '@/app/api/_lib/proxy-response';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';

export const dynamic = 'force-dynamic';

const PROXY_TIMEOUT_MS = 12_000;

const NOTIFICATIONS_API_URL = (
  process.env.NOTIFICATIONS_API_URL ||
  process.env.AUCTION_API_URL ||
  process.env.NEXT_PUBLIC_AUCTION_API_URL ||
  ''
).replace(/\/+$/, '');

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(id);
  }
}

export async function GET(request: NextRequest) {
  if (!NOTIFICATIONS_API_URL) {
    return NextResponse.json({ detail: 'Notifications service is not configured' }, { status: 503, headers: noStoreHeaders() });
  }

  const auth = getForwardedAuthorization(request);
  if (!auth) return unauthorizedResponse();

  const userId = extractUserIdForRateLimit(auth);
  const rl = checkRateLimit(request, { scope: 'notifications', limit: 60, windowMs: 60_000, userId });
  if (!rl.allowed) return rateLimitExceededResponse(rl);

  const url = new URL('/notifications', NOTIFICATIONS_API_URL);
  request.nextUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value));

  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: auth,
  };

  try {
    const res = await fetchWithTimeout(url.toString(), { method: 'GET', headers }, PROXY_TIMEOUT_MS);
    const data = await res.json().catch(() => ({}));
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
