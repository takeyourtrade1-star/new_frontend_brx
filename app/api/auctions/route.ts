/**
 * Proxy root /api/auctions → AUCTION_API_URL/auctions/
 * Handles list (GET) and create (POST) at the root level.
 * The [...path] catch-all does not match empty segments.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const AUCTION_API_URL = (
  process.env.AUCTION_API_URL ||
  process.env.NEXT_PUBLIC_AUCTION_API_URL ||
  ''
).replace(/\/+$/, '');

async function proxy(request: NextRequest) {
  if (!AUCTION_API_URL) {
    return NextResponse.json(
      { detail: 'AUCTION_API_URL is not configured' },
      { status: 503 }
    );
  }

  const url = new URL('/auctions/', AUCTION_API_URL);

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
    if (body)
      headers['Content-Type'] =
        request.headers.get('content-type') || 'application/json';
  }

  try {
    const res = await fetch(url.toString(), {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));

    const responseHeaders = new Headers();
    responseHeaders.set(
      'Cache-Control',
      'private, no-store, max-age=0, must-revalidate'
    );

    return NextResponse.json(data, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error('[auction proxy root]', err);
    return NextResponse.json(
      {
        detail:
          err instanceof Error ? err.message : 'Auction proxy request failed',
      },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxy(request);
}

export async function POST(request: NextRequest) {
  return proxy(request);
}
