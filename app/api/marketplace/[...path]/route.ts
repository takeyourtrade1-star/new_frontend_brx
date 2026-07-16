/**
 * Proxy to brx-marketplace microservice.
 * Browser calls same-origin /api/marketplace/... ; this route forwards to the backend.
 *
 * Production (recommended — dedicated subdomain, no path rewrite):
 *   MARKETPLACE_API_URL=https://marketplace-api.ebartex.com
 *
 * Setup: stacks/brx-marketplace/NGINX_MARKETPLACE_PROXY.md
 *        Main-app/frontend/MARKETPLACE_DOMAIN_SETUP.md
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  extractUserIdForRateLimit,
  getForwardedAuthorization,
} from '@/app/api/_lib/forwarded-authorization';
import { noStoreHeaders, publicCacheHeaders, unauthorizedResponse } from '@/app/api/_lib/proxy-response';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';
import { normalizeProxyPathSegments } from '@/app/api/_lib/safe-proxy-path';

export const dynamic = 'force-dynamic';

/** Fail fast before Amplify/API gateway returns opaque 504. */
const PROXY_TIMEOUT_MS = 12000;

const DEFAULT_MARKETPLACE_API_URL = 'https://marketplace-api.ebartex.com';

function getMarketplaceApiUrl(): string {
  const url =
    process.env.MARKETPLACE_API_URL ||
    process.env.NEXT_PUBLIC_MARKETPLACE_API_URL ||
    DEFAULT_MARKETPLACE_API_URL;
  return url.replace(/\/+$/, '');
}

/** Paths that do not require Authorization (public catalog). */
function isPublicMarketplacePath(path: string): boolean {
  return path.startsWith('listings/public/');
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: 'no-store',
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildTargetUrl(base: string, targetPath: string, request: NextRequest): URL {
  const url = new URL(targetPath, base);
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });
  return url;
}

async function proxy(request: NextRequest, pathSegments: string[]) {
  const path = normalizeProxyPathSegments(pathSegments);
  if (path === null) {
    return NextResponse.json(
      { detail: 'Percorso marketplace non valido' },
      { status: 400, headers: noStoreHeaders() },
    );
  }

  const MARKETPLACE_API_URL = getMarketplaceApiUrl();

  const targetPath = `/api/v1/${path}`;
  const isPublicGet =
    request.method === 'GET' && isPublicMarketplacePath(path);

  // Cookie-first: legge il cookie HttpOnly per le route private.
  // Le route pubbliche (listings/public/*) non richiedono autenticazione.
  const auth = isPublicGet ? undefined : getForwardedAuthorization(request);

  if (!isPublicGet && !auth) {
    return unauthorizedResponse();
  }

  const rateLimit = checkRateLimit(request, {
    scope: isPublicGet ? 'marketplace-public' : 'marketplace-private',
    limit: 60,
    windowMs: 60_000,
    userId: extractUserIdForRateLimit(auth),
  });
  if (!rateLimit.allowed) return rateLimitExceededResponse(rateLimit);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(auth ? { Authorization: auth } : {}),
  };

  let body: string | undefined;
  const contentType = request.headers.get('content-type');
  if (
    request.method !== 'GET' &&
    request.method !== 'HEAD' &&
    contentType?.includes('application/json')
  ) {
    body = await request.text();
    headers['Content-Type'] = 'application/json';
  }

  const fetchInit: RequestInit = {
    method: request.method,
    headers,
    body,
  };

  const primaryUrl = buildTargetUrl(MARKETPLACE_API_URL, targetPath, request);

  const responseCacheHeaders = isPublicGet
    ? publicCacheHeaders(30, 60)
    : noStoreHeaders();

  try {
    const res = await fetchWithTimeout(
      primaryUrl.toString(),
      fetchInit,
      PROXY_TIMEOUT_MS,
    );

    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, {
      status: res.status,
      headers: responseCacheHeaders,
    });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    if (!isTimeout) console.error('[marketplace proxy]', primaryUrl.toString());
    return NextResponse.json(
      {
        detail: isTimeout
          ? 'Timeout: marketplace-api non ha risposto in tempo.'
          : 'Marketplace proxy request failed',
      },
      { status: isTimeout ? 504 : 502, headers: noStoreHeaders() },
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

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}
