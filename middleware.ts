/**
 * Next.js Middleware — redirect UX per route autenticate.
 *
 * IMPORTANTE: il middleware è solo una misura UX (redirect rapido a /login).
 * NON è l'unica protezione: ogni route handler BFF e ogni page con dati
 * sensibili deve avere la propria verifica server-side.
 *
 * Controlla esclusivamente il cookie HttpOnly `ebartex_access_token` (scritto
 * dal BFF /api/auth al login). Non legge cookie Zustand/localStorage: quei
 * cookie non sono HttpOnly e possono essere falsificati lato client.
 *
 * Route protette da redirect:
 * - /account/*          → area personale utente
 * - /admin/*            → pannelli amministrativi
 * - /ordini/*           → ordini acquisti e vendite
 * - /cart               → carrello
 * - /vendi/*            → flusso inserimento annunci
 * - /aste/nuova         → creazione nuova asta
 * - /aste/mie           → aste personali
 * - /aste/partecipazioni → partecipazioni aste
 * - /bidding/*          → offerta massima
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthCookieName } from '@/app/api/_lib/auth-cookies';
import { resolveProductionAppOrigins } from '@/lib/production-app-origin';

const PROTECTED_PREFIXES = [
  '/account',
  '/admin',
  '/ordini',
  '/cart',
  '/vendi',
  '/aste/nuova',
  '/aste/mie',
  '/aste/partecipazioni',
  '/bidding',
  '/scambi',
];

const LOGIN_PATH = '/login';
const PRIVATE_CACHE_CONTROL = 'private, no-store, max-age=0';

function disablePrivateCaching(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', PRIVATE_CACHE_CONTROL);
  return response;
}

function canonicalAppOrigin(request: NextRequest): string | null {
  if (process.env.NODE_ENV !== 'production') return request.nextUrl.origin;
  return resolveProductionAppOrigins()?.canonicalOrigin ?? null;
}

/**
 * CSP stretta per le pagine HTML.
 *
 * Il nonce viene rigenerato per ogni richiesta e inoltrato a Next anche come
 * request header: Next 15 lo applica agli script di bootstrap/hydration. Non
 * accettiamo mai un eventuale x-nonce inviato dal client.
 */
export function buildContentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'`,
    "script-src-attr 'none'",
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://di0y87a9s8da9.cloudfront.net https://cdn.ebartex.com https://flagcdn.com https://cards.scryfall.io https://svgs.scryfall.io https://c1.scryfall.com https://c2.scryfall.com https://ebartex-user-uploads-prod.s3.eu-south-1.amazonaws.com",
    "font-src 'self' data:",
    "media-src 'self' https://di0y87a9s8da9.cloudfront.net https://cdn.ebartex.com",
    "connect-src 'self' https://di0y87a9s8da9.cloudfront.net https://cdn.ebartex.com wss://auction.ebartex.com https://ebartex-user-uploads-prod.s3.eu-south-1.amazonaws.com",
    "object-src 'none'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "manifest-src 'self'",
    'upgrade-insecure-requests',
  ].join('; ');
}

function createPageResponse(
  request: NextRequest,
  responseFactory: (requestHeaders: Headers) => NextResponse = (requestHeaders) =>
    NextResponse.next({ request: { headers: requestHeaders } })
): NextResponse {
  if (process.env.NODE_ENV === 'development') {
    return responseFactory(new Headers(request.headers));
  }

  // randomUUID usa il CSPRNG Web Crypto disponibile nell'Edge runtime. La
  // forma esadecimale evita caratteri ambigui nel grammar CSP.
  const nonce = crypto.randomUUID().replaceAll('-', '');
  const csp = buildContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = responseFactory(requestHeaders);
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtected) {
    const response = createPageResponse(request);
    return pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`)
      ? disablePrivateCaching(response)
      : response;
  }

  // Leggiamo solo i cookie HttpOnly impostati dal BFF /api/auth.
  // Non leggiamo cookie Zustand (ebartex-auth) perché non sono HttpOnly
  // e possono essere scritti da qualsiasi script client.
  // Il refresh token (30 giorni) conta come sessione: l'access token scade
  // in fretta e il client lo rinnova in modo silenzioso — senza questo
  // fallback l'utente loggato veniva rimbalzato a /login nella finestra tra
  // scadenza del cookie e refresh (es. click sul carrello appena riaperta
  // l'app). Il middleware è solo UX: l'auth vera resta nei route handler BFF.
  const sessionCookie = request.cookies.get(getAuthCookieName('access'))?.value;
  const refreshCookie = request.cookies.get(getAuthCookieName('refresh'))?.value;
  const hasSession = !!(sessionCookie?.trim() || refreshCookie?.trim());

  if (!hasSession) {
    const appOrigin = canonicalAppOrigin(request);
    if (!appOrigin) {
      return disablePrivateCaching(createPageResponse(
        request,
        () => new NextResponse(null, { status: 503 }),
      ));
    }
    const loginUrl = new URL(LOGIN_PATH, appOrigin);
    loginUrl.searchParams.set('accesso', '1');
    // Sanitize redirect: solo path relativi, niente protocol/double-slash injection
    const safeRedirect =
      pathname.startsWith('/') && !pathname.startsWith('//') && !pathname.includes('://')
        ? pathname
        : '/';
    loginUrl.searchParams.set('redirect', safeRedirect);
    return disablePrivateCaching(
      createPageResponse(request, () => NextResponse.redirect(loginUrl)),
    );
  }

  return disablePrivateCaching(createPageResponse(request));
}

export const config = {
  matcher: [
    // La CSP deve coprire ogni documento HTML. Escludiamo solo endpoint API e
    // asset gestiti direttamente da Next; non escludiamo genericamente i path
    // con un punto, perché uno slug pagina potrebbe contenerlo.
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
