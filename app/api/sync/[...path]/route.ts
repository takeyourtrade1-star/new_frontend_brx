/**
 * Proxy to BRX Sync microservice (CardTrader).
 * Avoids CORS: browser calls same-origin /api/sync/... and this route forwards to SYNC_API_URL.
 */

import { NextRequest, NextResponse } from 'next/server';

const SYNC_API_URL = (
  process.env.NEXT_PUBLIC_SYNC_API_URL ||
  process.env.SYNC_API_URL ||
  ''
).replace(/\/+$/, '');

async function proxy(request: NextRequest, pathSegments: string[]) {
  if (!SYNC_API_URL) {
    return NextResponse.json(
      { detail: 'NEXT_PUBLIC_SYNC_API_URL is not configured' },
      { status: 503 }
    );
  }

  const path = pathSegments.join('/');
  const targetPath = `/api/v1/sync${path ? `/${path}` : ''}`;
  const url = new URL(targetPath, SYNC_API_URL);
  // Forward query string (e.g. ?force=true)
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  // Case-insensitive: some runtimes normalize to lowercase
  const auth =
    request.headers.get('authorization') ||
    request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json(
      { detail: 'Authorization header required (Bearer token)' },
      { status: 401 }
    );
  }
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
    const res = await fetch(url.toString(), {
      method: request.method,
      headers,
      body,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[sync proxy]', err);
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : 'Proxy request failed' },
      { status: 502 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(request, path);
}
