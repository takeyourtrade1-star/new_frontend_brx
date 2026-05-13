/**
 * Proxy root /api/notifications → AUCTION_API_URL/notifications/
 * Handles GET (list) at the root level. Mutations live under the catch-all
 * route ([...path]) since they always have a sub-path.
 */

import { NextRequest, NextResponse } from 'next/server';

import { getForwardedAuthorization } from '@/app/api/_lib/forwarded-authorization';

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

  const url = new URL('/notifications/', AUCTION_API_URL);
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const auth = getForwardedAuthorization(request);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(auth ? { Authorization: auth } : {}),
  };

  try {
    const res = await fetch(url.toString(), {
      method: request.method,
      headers,
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

export async function GET(request: NextRequest) {
  return proxy(request);
}
