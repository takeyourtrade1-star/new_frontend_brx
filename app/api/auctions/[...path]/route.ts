/**
 * Proxy to Auction microservice (auction.ebartex.com).
 * Same-origin for the browser → no CORS issues.
 * Maps /api/auctions/* → AUCTION_API_URL/auctions/*
 */

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
  const targetPath = `/auctions${path ? `/${path}` : ''}`;
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
    console.error('[auction proxy]', err);
    return NextResponse.json(
      {
        detail:
          err instanceof Error ? err.message : 'Auction proxy request failed',
      },
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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(request, path);
}
