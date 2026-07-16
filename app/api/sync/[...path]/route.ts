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
import { normalizeProxyPathSegments } from '@/app/api/_lib/safe-proxy-path';

const PROXY_TIMEOUT_MS = 12_000;

function getSyncApiUrl(): string {
  const url =
    process.env.SYNC_API_URL ||
    process.env.NEXT_PUBLIC_SYNC_API_URL ||
    process.env.VITE_SYNC_API_URL ||
    '';
  return url.replace(/\/+$/, '');
}

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
  const path = normalizeProxyPathSegments(pathSegments);
  if (path === null) {
    return NextResponse.json(
      { detail: 'Percorso sync non valido' },
      { status: 400, headers: noStoreHeaders() }
    );
  }

  const SYNC_API_URL = getSyncApiUrl();
  if (!SYNC_API_URL) {
    return NextResponse.json(
      { detail: 'SYNC_API_URL or NEXT_PUBLIC_SYNC_API_URL is not configured' },
      { status: 503, headers: noStoreHeaders() }
    );
  }

  const auth = getForwardedAuthorization(request);
  if (!auth) return unauthorizedResponse();

  const userId = extractUserIdForRateLimit(auth);
  const rl = checkRateLimit(request, { scope: 'sync', limit: 30, windowMs: 60_000, userId });
  if (!rl.allowed) return rateLimitExceededResponse(rl);

  const targetPath = `/api/v1/sync${path ? `/${path}` : ''}`;
  const url = new URL(targetPath, SYNC_API_URL);
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: auth,
  };

  let body: string | undefined;
  const contentType = request.headers.get('content-type');
  if (request.method !== 'GET' && request.method !== 'HEAD' && contentType?.includes('application/json')) {
    body = await request.text();
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetchWithTimeout(url.toString(), { method: request.method, headers, body }, PROXY_TIMEOUT_MS);
    const data = await res.json().catch(() => ({}));
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
