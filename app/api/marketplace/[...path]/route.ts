/**
 * Proxy to brx-marketplace microservice.
 * Browser calls same-origin /api/marketplace/... ; this route forwards to the backend.
 *
 * Configure on Amplify (runtime, server-side):
 *   MARKETPLACE_API_URL=https://api.ebartex.com/marketplace
 * or direct:
 *   MARKETPLACE_API_URL=http://15.160.8.178:8004
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getMarketplaceApiUrl(): string {
  const url =
    process.env.MARKETPLACE_API_URL ||
    process.env.NEXT_PUBLIC_MARKETPLACE_API_URL ||
    '';
  return url.replace(/\/+$/, '');
}

/** Paths that do not require Authorization (public catalog). */
function isPublicMarketplacePath(path: string): boolean {
  return path.startsWith('listings/public/');
}

async function proxy(request: NextRequest, pathSegments: string[]) {
  const MARKETPLACE_API_URL = getMarketplaceApiUrl();
  if (!MARKETPLACE_API_URL) {
    return NextResponse.json(
      {
        detail:
          'MARKETPLACE_API_URL or NEXT_PUBLIC_MARKETPLACE_API_URL is not configured',
      },
      { status: 503 },
    );
  }

  const path = pathSegments.join('/');
  const targetPath = `/api/v1/${path}`;
  const url = new URL(targetPath, MARKETPLACE_API_URL);

  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

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

  try {
    const res = await fetch(url.toString(), {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    });

    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, {
      status: res.status,
      headers: {
        'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
      },
    });
  } catch (err) {
    console.error('[marketplace proxy]', err);
    return NextResponse.json(
      {
        detail:
          err instanceof Error ? err.message : 'Marketplace proxy request failed',
      },
      { status: 502 },
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
