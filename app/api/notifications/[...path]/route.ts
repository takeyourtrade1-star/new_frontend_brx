import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const AUCTION_API_URL = (
  process.env.AUCTION_API_URL ||
  process.env.NEXT_PUBLIC_AUCTION_API_URL ||
  ''
).replace(/\/+$/, '');

async function proxy(request: NextRequest, pathSegments: string[]) {
  if (!AUCTION_API_URL) {
    return NextResponse.json(
      { detail: 'AUCTION_API_URL is not configured' },
      { status: 503 }
    );
  }

  const path = pathSegments.join('/');
  const targetPath = `/notifications${path ? `/${path}` : ''}`;
  const url = new URL(targetPath, AUCTION_API_URL);
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const auth =
    request.headers.get('authorization') ||
    request.headers.get('Authorization');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(auth ? { Authorization: auth } : {}),
  };

  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text();
    if (body) {
      headers['Content-Type'] = request.headers.get('content-type') || 'application/json';
    }
  }

  try {
    const res = await fetch(url.toString(), {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      {
        detail:
          err instanceof Error ? err.message : 'Notifications proxy request failed',
      },
      { status: 502 }
    );
  }
}

async function withParams(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return withParams(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return withParams(request, context);
}
