/**
 * Listings by blueprint (public). Proxies to BRX Sync without auth.
 */

import { NextRequest, NextResponse } from 'next/server';

const SYNC_API_URL = (
  process.env.SYNC_API_URL ||
  process.env.NEXT_PUBLIC_SYNC_API_URL ||
  ''
).replace(/\/+$/, '');

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ blueprintId: string }> }
) {
  const { blueprintId } = await context.params;
  const base = blueprintId.includes(':') ? blueprintId.split(':')[0] : blueprintId;
  const blueprintIdNum = parseInt(base, 10);
  if (Number.isNaN(blueprintIdNum) || blueprintIdNum < 1) {
    return NextResponse.json({ error: 'blueprintId non valido' }, { status: 400 });
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
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[listings proxy]', err);
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      {
        error: isAbort
          ? 'Timeout upstream Sync'
          : err instanceof Error
            ? err.message
            : 'Proxy request failed',
      },
      { status: isAbort ? 504 : 502 }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
