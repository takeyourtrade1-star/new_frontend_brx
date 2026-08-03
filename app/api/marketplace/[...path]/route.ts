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
import { marketplaceProxyPolicy } from '@/app/api/_lib/marketplace-proxy-policy';
import { readTextBodyWithLimit } from '@/app/api/_lib/request-body';
import { enforceSameOrigin } from '@/app/api/_lib/request-security';
import { normalizeProxyPathSegments } from '@/app/api/_lib/safe-proxy-path';
import { readJsonResponseWithLimit } from '@/app/api/_lib/bounded-json-response';
import { trustedMarketplaceServiceOrigin } from '@/app/api/_lib/upstream-url';
import { fetchWithBodyDeadline } from '@/app/api/_lib/upstream-fetch';
import { getMarketplaceApiUrlEnv } from '@/lib/server-runtime-env';
import { appendQueryWithPolicy, QUERY_POSITIVE_INTEGER, type QueryRules } from '@/app/api/_lib/query-policy';

export const dynamic = 'force-dynamic';

/** Fail fast before Amplify/API gateway returns opaque 504. */
const PROXY_TIMEOUT_MS = 12000;
const MAX_MARKETPLACE_BODY_BYTES = 128 * 1024;
const MAX_MARKETPLACE_RESPONSE_BYTES = 2 * 1024 * 1024;

function getMarketplaceApiUrl(): string {
  return trustedMarketplaceServiceOrigin(getMarketplaceApiUrlEnv());
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('Accept-Encoding', 'identity');
  return fetchWithBodyDeadline(url, {
    ...init,
    headers,
    cache: 'no-store',
    redirect: 'error',
  }, timeoutMs);
}

function marketplaceQueryRules(path: string, method: string): QueryRules {
  if (method !== 'GET') return {};
  if (path === 'listings') {
    return {
      page: QUERY_POSITIVE_INTEGER,
      page_size: QUERY_POSITIVE_INTEGER,
      status_filter: /^(?:active|paused|sold|cancelled)$/,
    };
  }
  if (/^listings\/public\/by-blueprint\/[1-9]\d{0,18}$/.test(path)) {
    return { card_id: /^[A-Za-z0-9._~%-]{1,128}$/ };
  }
  if (path === 'listings/public/best-sellers') {
    return { game: /^[a-z0-9_-]{1,32}$/i, limit: QUERY_POSITIVE_INTEGER };
  }
  if (path === 'orders' || path === 'collections' || path === 'sync/events') {
    return { page: QUERY_POSITIVE_INTEGER, page_size: QUERY_POSITIVE_INTEGER };
  }
  return {};
}

function buildTargetUrl(base: string, targetPath: string, request: NextRequest, path: string): URL | null {
  const url = new URL(targetPath, base);
  return appendQueryWithPolicy(url, request.nextUrl, marketplaceQueryRules(path, request.method))
    ? url
    : null;
}

async function proxy(request: NextRequest, pathSegments: string[]) {
  const path = normalizeProxyPathSegments(pathSegments);
  if (path === null) {
    return NextResponse.json(
      { detail: 'Percorso marketplace non valido' },
      { status: 400, headers: noStoreHeaders() },
    );
  }

  const policy = marketplaceProxyPolicy(path, request.method);
  if (!policy.allowed) {
    return NextResponse.json(
      { detail: 'Not found' },
      { status: 404, headers: noStoreHeaders() },
    );
  }

  const originViolation = enforceSameOrigin(request);
  if (originViolation) return originViolation;

  const MARKETPLACE_API_URL = getMarketplaceApiUrl();
  if (!MARKETPLACE_API_URL) {
    return NextResponse.json(
      { detail: 'Marketplace service unavailable' },
      { status: 503, headers: noStoreHeaders() },
    );
  }

  const targetPath = `/api/v1/${path}`;
  const isPublicGet = request.method === 'GET' && policy.public;

  // Cookie-first: legge il cookie HttpOnly per le route private.
  // Le route pubbliche (listings/public/*) non richiedono autenticazione.
  const auth = isPublicGet ? undefined : getForwardedAuthorization(request);

  if (!isPublicGet && !auth) {
    return unauthorizedResponse();
  }

  const rateLimit = await checkRateLimit(request, {
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
    const bodyResult = await readTextBodyWithLimit(request, MAX_MARKETPLACE_BODY_BYTES);
    if (bodyResult.tooLarge) {
      return NextResponse.json(
        { detail: 'Request body too large' },
        { status: 413, headers: noStoreHeaders() },
      );
    }
    body = bodyResult.body;
    headers['Content-Type'] = 'application/json';
  }

  const fetchInit: RequestInit = {
    method: request.method,
    headers,
    body,
  };

  const primaryUrl = buildTargetUrl(MARKETPLACE_API_URL, targetPath, request, path);
  if (!primaryUrl) {
    return NextResponse.json(
      { detail: 'Invalid query parameters' },
      { status: 400, headers: noStoreHeaders() },
    );
  }

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

    if (!res.ok) {
      const publicStatus = res.status >= 500 ? 502 : res.status;
      const detail =
        res.status === 401
          ? 'Autenticazione richiesta'
          : res.status === 403
            ? 'Permessi insufficienti'
            : res.status === 404
              ? 'Risorsa non trovata'
              : res.status === 409
                ? 'Operazione in conflitto'
                : res.status === 422
                  ? 'Dati richiesta non validi'
                  : 'Operazione marketplace non riuscita';
      return NextResponse.json(
        { detail },
        { status: publicStatus, headers: noStoreHeaders() },
      );
    }

    const data = await readJsonResponseWithLimit(res, MAX_MARKETPLACE_RESPONSE_BYTES);
    return NextResponse.json(data, {
      status: res.status,
      headers: responseCacheHeaders,
    });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    if (!isTimeout) {
      console.error(
        '[marketplace proxy] request failed',
        err instanceof Error ? err.name : 'UnknownError',
      );
    }
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
