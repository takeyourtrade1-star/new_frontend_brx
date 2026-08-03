/**
 * Listings by blueprint (public). Proxies to BRX Sync without auth.
 * GET /api/listings?blueprint_id=123 or blueprint_id=278502:1 (variant format → use 278502).
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';
import { publicCacheHeaders } from '@/app/api/_lib/proxy-response';
import { readJsonResponseWithLimit } from '@/app/api/_lib/bounded-json-response';
import { trustedServiceOrigin } from '@/app/api/_lib/upstream-url';
import { fetchWithBodyDeadline } from '@/app/api/_lib/upstream-fetch';

const SYNC_API_URL = trustedServiceOrigin(
  process.env.SYNC_API_URL
);

/** Default timeout for proxy to Sync API (ms). Reduces 502 from gateway timeouts. */
const PROXY_TIMEOUT_MS = 15000;

/** Parse blueprint_id from "123" or "278502:1" (use part before colon). */
function parseBlueprintId(value: string | null): number {
  if (!value || !/^[1-9]\d{0,18}(?::\d{1,9})?$/.test(value.trim())) return NaN;
  const base = value.includes(':') ? value.split(':')[0].trim() : value.trim();
  const parsed = Number(base);
  return Number.isSafeInteger(parsed) ? parsed : NaN;
}

export async function GET(request: NextRequest) {
  const rl = await checkRateLimit(request, { scope: 'public-listings', limit: 120, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitExceededResponse(rl);

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

  try {
    const res = await fetchWithBodyDeadline(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json', 'Accept-Encoding': 'identity' },
      redirect: 'error',
    }, PROXY_TIMEOUT_MS);
    if (!res.ok) {
      return NextResponse.json(
        {
          error: res.status === 404 ? 'Listings non trovate' : 'Servizio listings temporaneamente non disponibile',
          blueprint_id: blueprintIdNum,
        },
        { status: res.status === 404 ? 404 : 502 }
      );
    }
    const data = await readJsonResponseWithLimit(res, 2 * 1_024 * 1_024);
    return NextResponse.json(data, { status: res.status, headers: publicCacheHeaders(30, 60) });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    console.error('[listings proxy]', isTimeout ? 'timeout' : 'fetch error');
    // Dettaglio dell'errore solo nei log server (sopra); al client messaggio generico.
    return NextResponse.json(
      {
        error: isTimeout
          ? 'Timeout: servizio listings non ha risposto in tempo.'
          : 'Servizio listings temporaneamente non disponibile.',
        blueprint_id: blueprintIdNum,
      },
      { status: 502 }
    );
  }
}
