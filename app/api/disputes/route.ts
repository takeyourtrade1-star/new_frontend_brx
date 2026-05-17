import { NextRequest, NextResponse } from 'next/server';

import { getForwardedAuthorization } from '@/app/api/_lib/forwarded-authorization';

export const dynamic = 'force-dynamic';

const AUCTION_API_URL = (
  process.env.AUCTION_API_URL ||
  process.env.NEXT_PUBLIC_AUCTION_API_URL ||
  ''
).replace(/\/+$/, '');

export async function GET(request: NextRequest) {
  if (!AUCTION_API_URL) {
    return NextResponse.json({ detail: 'AUCTION_API_URL is not configured' }, { status: 503 });
  }
  const url = new URL('/disputes', AUCTION_API_URL);
  request.nextUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value));
  const auth = getForwardedAuthorization(request);
  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        ...(auth ? { Authorization: auth } : {}),
      },
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { detail: err instanceof Error ? err.message : 'Disputes proxy request failed' },
      { status: 502 }
    );
  }
}
