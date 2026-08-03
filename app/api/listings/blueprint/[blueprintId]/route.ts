/**
 * Listings by blueprint (public). Proxies to BRX Sync without auth.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';
import { publicCacheHeaders } from '@/app/api/_lib/proxy-response';
import { readJsonResponseWithLimit } from '@/app/api/_lib/bounded-json-response';
import { trustedSyncServiceOrigin } from '@/app/api/_lib/upstream-url';
import { fetchWithBodyDeadline } from '@/app/api/_lib/upstream-fetch';
import { getSyncApiUrlEnv } from '@/lib/server-runtime-env';

const SYNC_API_URL = trustedSyncServiceOrigin(
  getSyncApiUrlEnv()
);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ blueprintId: string }> }
) {
  const rl = await checkRateLimit(request, { scope: 'public-listings', limit: 120, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitExceededResponse(rl);

  const { blueprintId } = await context.params;
  if (!/^[1-9]\d{0,18}(?::\d{1,9})?$/.test(blueprintId.trim())) {
    return NextResponse.json({ error: 'blueprintId non valido' }, { status: 400 });
  }
  const base = blueprintId.includes(':') ? blueprintId.split(':')[0] : blueprintId;
  const blueprintIdNum = Number(base);
  if (!Number.isSafeInteger(blueprintIdNum) || blueprintIdNum < 1) {
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
  try {
    const res = await fetchWithBodyDeadline(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json', 'Accept-Encoding': 'identity' },
      redirect: 'error',
    }, 12_000);
    if (!res.ok) {
      return NextResponse.json(
        { error: res.status === 404 ? 'Listings non trovate' : 'Servizio listings temporaneamente non disponibile' },
        { status: res.status === 404 ? 404 : 502 },
      );
    }
    const data = await readJsonResponseWithLimit(res, 2 * 1_024 * 1_024);
    return NextResponse.json(data, { status: res.status, headers: publicCacheHeaders(30, 60) });
  } catch (err) {
    console.error('[listings proxy]', err instanceof Error ? err.name : 'UnknownError');
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      {
        error: isAbort
          ? 'Servizio listings temporaneamente non disponibile'
          : 'Servizio listings temporaneamente non disponibile',
      },
      { status: isAbort ? 504 : 502 }
    );
  }
}
