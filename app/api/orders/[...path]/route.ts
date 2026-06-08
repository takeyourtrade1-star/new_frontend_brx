/**
 * Proxy /api/orders/* → AUCTION_API_URL/orders/*
 * Sicurezza: cookie-first, 401 fail-closed, no-store, rate limit, timeout.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getForwardedAuthorization, extractUserIdForRateLimit } from '@/app/api/_lib/forwarded-authorization';
import { noStoreHeaders, unauthorizedResponse } from '@/app/api/_lib/proxy-response';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';

export const dynamic = 'force-dynamic';

const PROXY_TIMEOUT_MS = 12_000;

const AUCTION_API_URL = (
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

async function proxy(request: NextRequest, pathSegments: string[]) {
  if (!AUCTION_API_URL) {
    return NextResponse.json(
      { detail: 'AUCTION_API_URL is not configured' },
      { status: 503, headers: noStoreHeaders() }
    );
  }

  const auth = getForwardedAuthorization(request);
  if (!auth) return unauthorizedResponse();

  const userId = extractUserIdForRateLimit(auth);
  const rl = checkRateLimit(request, { scope: 'orders', limit: 60, windowMs: 60_000, userId });
  if (!rl.allowed) return rateLimitExceededResponse(rl);

  const path = pathSegments.join('/');
  const targetPath = `/orders${path ? `/${path}` : ''}`;
  const url = new URL(targetPath, AUCTION_API_URL);
  request.nextUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value));

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: auth,
  };

  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text();
    if (body) headers['Content-Type'] = request.headers.get('content-type') || 'application/json';
  }

  try {
    const res = await fetchWithTimeout(url.toString(), { method: request.method, headers, body }, PROXY_TIMEOUT_MS);
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status, headers: noStoreHeaders() });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    if (!isTimeout) console.error('[orders proxy] fetch error');
    return NextResponse.json(
      { detail: isTimeout ? 'Timeout: orders service non ha risposto.' : 'Orders proxy request failed' },
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

export async function PATCH(request: NextRequest, context: RouteContext) {
  return withParams(request, context);
}
