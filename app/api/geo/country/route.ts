import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  rateLimitExceededResponse,
} from '@/app/api/_lib/rate-limit';
import { countryFromTrustedEdge } from '@/app/api/_lib/trusted-country';

export const dynamic = 'force-dynamic';

/**
 * Same-origin geo hint for the browser (CSP connect-src stays tight).
 *
 * The application never discloses the caller's IP to a geolocation vendor.
 * Country is accepted only from an edge header explicitly selected by the
 * deployment; the edge must overwrite/remove that header at the public trust
 * boundary just like the client-IP header used by the rate limiter.
 */
export async function GET(request: NextRequest) {
  const rl = await checkRateLimit(request, { scope: 'geo-country', limit: 30, windowMs: 60 * 60_000 });
  if (!rl.allowed) return rateLimitExceededResponse(rl);

  const countryCode = countryFromTrustedEdge(request);
  return NextResponse.json(
    countryCode ? { country_code: countryCode } : {},
    { headers: { 'Cache-Control': 'private, no-store, max-age=0' } },
  );
}
