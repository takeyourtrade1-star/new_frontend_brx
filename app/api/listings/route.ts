/**
 * Listings by blueprint (public). Proxies to BRX Sync without auth.
 * GET /api/listings?blueprint_id=123
 */

import { NextRequest, NextResponse } from 'next/server';

const SYNC_API_URL = (
  process.env.SYNC_API_URL ||
  process.env.NEXT_PUBLIC_SYNC_API_URL ||
  ''
).replace(/\/+$/, '');

export async function GET(request: NextRequest) {
  const blueprintId = request.nextUrl.searchParams.get('blueprint_id');
  const blueprintIdNum = blueprintId ? parseInt(blueprintId, 10) : NaN;
  if (Number.isNaN(blueprintIdNum) || blueprintIdNum < 1) {
    return NextResponse.json({ error: 'blueprint_id richiesto e deve essere un numero positivo' }, { status: 400 });
  }

  if (!SYNC_API_URL) {
    return NextResponse.json(
      { error: 'Sync API non configurata' },
      { status: 503 }
    );
  }

  const url = new URL(
    `/api/v1/sync/listings/blueprint/${blueprintIdNum}`,
    SYNC_API_URL
  );

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[listings proxy]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Proxy request failed' },
      { status: 502 }
    );
  }
}
