import { NextRequest, NextResponse } from 'next/server';
import { noStoreHeaders } from './proxy-response';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function normalizedOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.origin;
  } catch {
    return null;
  }
}

function expectedOrigins(request: NextRequest): Set<string> {
  const origins = new Set<string>();

  if (process.env.NODE_ENV === 'production') {
    // Never derive the production trust boundary from Host/X-Forwarded-Host:
    // both are request metadata and can be attacker-controlled when an ingress
    // is misconfigured. APP_ORIGIN is an explicit deployment contract.
    const configured = process.env.APP_ORIGIN;
    const origin = configured ? normalizedOrigin(configured) : null;
    if (origin?.startsWith('https://')) {
      const hostname = new URL(origin).hostname;
      if (hostname === 'ebartex.com' || hostname.endsWith('.ebartex.com')) {
        origins.add(origin);
      }
    }
    return origins;
  }

  origins.add(request.nextUrl.origin);

  const configured = [
    process.env.APP_ORIGIN,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ];
  for (const candidate of configured) {
    if (!candidate) continue;
    const origin = normalizedOrigin(candidate);
    if (origin) origins.add(origin);
  }

  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = forwardedHost || request.headers.get('host')?.trim();
  if (host) {
    const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
    const protocol = forwardedProto === 'http' || forwardedProto === 'https'
      ? forwardedProto
      : request.nextUrl.protocol.replace(':', '');
    const origin = normalizedOrigin(`${protocol}://${host}`);
    if (origin) origins.add(origin);
  }
  return origins;
}

/**
 * Protezione CSRF per ogni mutazione cookie-auth.
 *
 * I browser moderni inviano `Origin` o Fetch Metadata. Le chiamate server-to-
 * server prive di entrambi restano compatibili, ma `Sec-Fetch-Site: cross-site`
 * e ogni Origin non esatta vengono sempre bloccati prima di leggere il body.
 */
export function enforceSameOrigin(request: NextRequest): NextResponse | null {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return null;

  const fetchSite = request.headers.get('sec-fetch-site')?.toLowerCase();
  if (fetchSite === 'cross-site') {
    return NextResponse.json(
      { detail: 'Origine richiesta non consentita' },
      { status: 403, headers: noStoreHeaders() },
    );
  }

  const rawOrigin = request.headers.get('origin');
  if (!rawOrigin) {
    if (
      process.env.NODE_ENV === 'production' &&
      (fetchSite !== 'same-origin' || expectedOrigins(request).size === 0)
    ) {
      return NextResponse.json(
        { detail: 'Origine richiesta non consentita' },
        { status: 403, headers: noStoreHeaders() },
      );
    }
    return null;
  }
  const origin = normalizedOrigin(rawOrigin);
  if (!origin || !expectedOrigins(request).has(origin)) {
    return NextResponse.json(
      { detail: 'Origine richiesta non consentita' },
      { status: 403, headers: noStoreHeaders() },
    );
  }
  return null;
}

/**
 * Impedisce ai form/simple request cross-origin di camuffare JSON come
 * `text/plain`. Il parsing avviene solo dopo questo controllo.
 */
export function enforceJsonContentType(request: NextRequest): NextResponse | null {
  const mediaType = request.headers
    .get('content-type')
    ?.split(';', 1)[0]
    ?.trim()
    .toLowerCase();
  if (mediaType === 'application/json') return null;
  return NextResponse.json(
    { detail: 'Content-Type non supportato' },
    { status: 415, headers: noStoreHeaders() },
  );
}
