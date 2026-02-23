/**
 * Listings by blueprint (public). Proxies to BRX Sync without auth.
 * GET /api/listings?blueprint_id=123 or blueprint_id=278502:1 (variant format → use 278502).
 */

import { NextRequest, NextResponse } from 'next/server';

const SYNC_API_URL = (
  process.env.SYNC_API_URL ||
  process.env.NEXT_PUBLIC_SYNC_API_URL ||
  ''
).replace(/\/+$/, '');

/** Default timeout for proxy to Sync API (ms). Reduces 502 from gateway timeouts. */
const PROXY_TIMEOUT_MS = 15000;

/** Parse blueprint_id from "123" or "278502:1" (use part before colon). */
function parseBlueprintId(value: string | null): number {
  if (value == null || value === '') return NaN;
  const base = value.includes(':') ? value.split(':')[0].trim() : value.trim();
  return parseInt(base, 10);
}

export async function GET(request: NextRequest) {
  const blueprintId = request.nextUrl.searchParams.get('blueprint_id');
  const blueprintIdNum = parseBlueprintId(blueprintId);
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await res.json().catch(() => ({}));
    if (res.status >= 500) {
      return NextResponse.json(
        { error: data?.error || 'Servizio listings temporaneamente non disponibile', blueprint_id: blueprintIdNum },
        { status: 502 }
      );
    }
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    console.error('[listings proxy]', isTimeout ? 'timeout' : err);
    return NextResponse.json(
      {
        error: isTimeout
          ? 'Timeout: servizio listings non ha risposto in tempo.'
          : (err instanceof Error ? err.message : 'Proxy request failed'),
        blueprint_id: blueprintIdNum,
      },
      { status: 502 }
    );
  }
}
