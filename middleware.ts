/**
 * Next.js Middleware — protezione route autenticate.
 * Verifica la presenza del token di accesso nel cookie o in localStorage (via Zustand persist).
 * Se il token non è presente, redirige a /login.
 *
 * Route protette:
 * - /account/*  → area personale utente
 * - /admin/*    → pannelli amministrativi
 *
 * Il middleware gira server-side (Edge Runtime) quindi non ha accesso a localStorage.
 * Controlla il cookie `ebartex-auth` (scritto da Zustand persist) come proxy per lo stato auth.
 * Se il cookie non contiene un accessToken valido, redirige a /login.
 */

import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = ['/account', '/admin'];

const LOGIN_PATH = '/login';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Zustand persist scrive lo stato auth in localStorage → non accessibile dal middleware.
  // Come fallback server-side, controlliamo se esiste il cookie di sessione auth
  // oppure l'header Authorization (per chiamate programmatiche).
  // Il token può essere passato anche come cookie "ebartex_access_token" dal client.
  const authCookie = request.cookies.get('ebartex_access_token')?.value;
  const authHeader = request.headers.get('authorization');

  // Zustand persist usa localStorage, non cookie. Per catturare gli utenti non loggati
  // al primo caricamento server-side, controlliamo anche il cookie Zustand persist.
  // Il cookie "ebartex-auth" viene scritto da un piccolo script se il persist è attivo.
  // Fallback: accettiamo anche l'header per API calls.
  const zustandCookie = request.cookies.get('ebartex-auth')?.value;
  let hasZustandToken = false;
  if (zustandCookie) {
    try {
      const parsed = JSON.parse(zustandCookie);
      hasZustandToken = !!(parsed?.state?.accessToken);
    } catch {
      // Cookie malformato, ignora
    }
  }

  const hasToken = !!(authCookie || authHeader || hasZustandToken);

  if (!hasToken) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set('accesso', '1');
    // Sanitize redirect: only allow relative paths starting with / (no protocol, no //)
    const safeRedirect = pathname.startsWith('/') && !pathname.startsWith('//') && !pathname.includes('://') ? pathname : '/';
    loginUrl.searchParams.set('redirect', safeRedirect);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*'],
};
