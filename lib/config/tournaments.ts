import { sanitizeInternalReturnPath } from '@/lib/security/internal-return-path';

/** Piattaforma tornei Ebartex (sottodominio esterno). */
export const TOURNAMENTS_PORTAL_URL = 'https://tornei.ebartex.com';

/** Route sul portale tornei per silent login (solo lato tornei.ebartex.com). */
export const TOURNAMENTS_AUTH_BRIDGE_PATH = '/auth/bridge';

/** Path interno marketplace: video introduttivo prima del portale. */
export const TOURNAMENTS_TRANSITION_PATH = '/tornei';

export function isTournamentsTransitionPath(pathname?: string | null): boolean {
  const path = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '');
  return path === TOURNAMENTS_TRANSITION_PATH || path.startsWith(`${TOURNAMENTS_TRANSITION_PATH}/`);
}

/** URL diretto al portale (senza /auth/bridge che può reindirizzare al login marketplace). */
export function getTournamentsPortalUrl(returnPath = '/'): string {
  const base = TOURNAMENTS_PORTAL_URL.replace(/\/+$/, '');
  const safePath = sanitizeInternalReturnPath(returnPath) ?? '/';
  return `${base}${safePath}`;
}

export const TOURNAMENTS_PORTAL_LINK_PROPS = {
  href: getTournamentsPortalUrl('/'),
  target: '_blank',
  rel: 'noopener noreferrer',
} as const;
