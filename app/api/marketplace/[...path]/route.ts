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

export const dynamic = 'force-dynamic';

/** Fail fast before Amplify/API gateway returns opaque 504. */
const PROXY_TIMEOUT_MS = 12000;

const DEFAULT_MARKETPLACE_API_URL = 'http://marketplace-api.ebartex.com';

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
  const MARKETPLACE_API_URL = getMarketplaceApiUrl();

  const path = pathSegments.join('/');
  const targetPath = `/api/v1/${path}`;
  const isPublicGet =
    request.method === 'GET' && isPublicMarketplacePath(path);

  const auth =
    request.headers.get('authorization') ||
    request.headers.get('Authorization');

  if (!isPublicMarketplacePath(path) && !auth?.startsWith('Bearer ')) {
    return NextResponse.json(
      { detail: 'Authorization header required (Bearer token)' },
      { status: 401 },
    );
  }

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

  const responseCacheHeaders: Record<string, string> = isPublicGet
    ? { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' }
    : { 'Cache-Control': 'private, no-store, max-age=0, must-revalidate' };

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
    console.error('[marketplace proxy]', isTimeout ? 'timeout' : err, primaryUrl.toString());
    return NextResponse.json(
      {
        detail: isTimeout
          ? 'Timeout: marketplace-api non ha risposto in tempo. Verifica marketplace-api.ebartex.com in NPM.'
          : err instanceof Error
            ? err.message
            : 'Marketplace proxy request failed',
      },
      { status: isTimeout ? 504 : 502 },
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
