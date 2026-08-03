import { NextRequest, NextResponse } from 'next/server';

import { noStoreHeaders } from '@/app/api/_lib/proxy-response';
import { resolveProductionAppOrigins } from '@/lib/production-app-origin';


function canonicalOrigin(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.origin : null;
  } catch {
    return null;
  }
}


/** Gate large/read-only scanner resources against cross-site drive-by loads. */
export function enforceScannerBrowserFetch(request: NextRequest): NextResponse | null {
  const scannerHeader = request.headers.get('x-scanner-request');
  const fetchSite = request.headers.get('sec-fetch-site')?.trim().toLowerCase();
  const fetchDest = request.headers.get('sec-fetch-dest')?.trim().toLowerCase();
  const rawOrigin = request.headers.get('origin');
  const origin = canonicalOrigin(rawOrigin);
  const productionOrigins = process.env.NODE_ENV === 'production'
    ? resolveProductionAppOrigins()
    : null;
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? new Set(productionOrigins?.sameOriginOrigins ?? [])
    : new Set([request.nextUrl.origin]);

  if (
    scannerHeader !== '1' ||
    (process.env.NODE_ENV === 'production' && productionOrigins === null) ||
    (fetchSite !== undefined && fetchSite !== 'same-origin') ||
    (fetchDest !== undefined && fetchDest !== 'empty') ||
    (rawOrigin !== null &&
      (origin === null || !allowedOrigins.has(origin)))
  ) {
    const headers = noStoreHeaders({
      'Cross-Origin-Resource-Policy': 'same-origin',
      'X-Content-Type-Options': 'nosniff',
    });
    return NextResponse.json(
      { detail: 'Richiesta scanner non consentita' },
      { status: 403, headers },
    );
  }
  return null;
}
