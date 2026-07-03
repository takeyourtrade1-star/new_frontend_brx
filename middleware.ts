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
import { config as appConfig } from '@/lib/config';

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Leggiamo solo i cookie HttpOnly impostati dal BFF /api/auth.
  // Non leggiamo cookie Zustand (ebartex-auth) perché non sono HttpOnly
  // e possono essere scritti da qualsiasi script client.
  // Il refresh token (30 giorni) conta come sessione: l'access token scade
  // in fretta e il client lo rinnova in modo silenzioso — senza questo
  // fallback l'utente loggato veniva rimbalzato a /login nella finestra tra
  // scadenza del cookie e refresh (es. click sul carrello appena riaperta
  // l'app). Il middleware è solo UX: l'auth vera resta nei route handler BFF.
  const sessionCookie = request.cookies.get(appConfig.auth.tokenKey)?.value;
  const refreshCookie = request.cookies.get(appConfig.auth.refreshTokenKey)?.value;
  const hasSession = !!(sessionCookie?.trim() || refreshCookie?.trim());

  if (!hasSession) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set('accesso', '1');
    // Sanitize redirect: solo path relativi, niente protocol/double-slash injection
    const safeRedirect =
      pathname.startsWith('/') && !pathname.startsWith('//') && !pathname.includes('://')
        ? pathname
        : '/';
    loginUrl.searchParams.set('redirect', safeRedirect);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/account/:path*',
    '/admin/:path*',
    '/ordini/:path*',
    '/cart',
    '/vendi/:path*',
    '/aste/nuova',
    '/aste/nuova/:path*',
    '/aste/mie',
    '/aste/mie/:path*',
    '/aste/partecipazioni',
    '/aste/partecipazioni/:path*',
    '/bidding',
    '/bidding/:path*',
    '/scambi',
    '/scambi/:path*',
  ],
};
