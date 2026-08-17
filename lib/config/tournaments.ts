import { sanitizeInternalReturnPath } from '@/lib/security/internal-return-path';

/** Piattaforma tornei Ebartex (sottodominio esterno). */
export const TOURNAMENTS_PORTAL_URL = 'https://tornei.ebartex.com';

/** Route first-party che avvia authorization code + PKCE sul portale Tornei. */
export const TOURNAMENTS_AUTH_BRIDGE_PATH = '/auth/bridge/sso/start';
export const TOURNAMENTS_SSO_CALLBACK_PATH = '/auth/bridge/sso/callback';
export const TOURNAMENTS_SSO_CALLBACK_URL =
  `${TOURNAMENTS_PORTAL_URL}${TOURNAMENTS_SSO_CALLBACK_PATH}`;

/** Path interno marketplace: video introduttivo prima del portale. */
export const TOURNAMENTS_TRANSITION_PATH = '/tornei';

export function isTournamentsTransitionPath(pathname?: string | null): boolean {
  const path = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '');
  return path === TOURNAMENTS_TRANSITION_PATH || path.startsWith(`${TOURNAMENTS_TRANSITION_PATH}/`);
}

/** URL del bridge SSO; `next` resta sempre un path interno del portale. */
export function getTournamentsPortalUrl(returnPath = '/'): string {
  const safePath = sanitizeInternalReturnPath(returnPath) ?? '/';
  const url = new URL(TOURNAMENTS_AUTH_BRIDGE_PATH, TOURNAMENTS_PORTAL_URL);
  url.searchParams.set('next', safePath);
  return url.href;
}

export const TOURNAMENTS_PORTAL_LINK_PROPS = {
  href: getTournamentsPortalUrl('/'),
  target: '_blank',
  rel: 'noopener noreferrer',
} as const;
