/** Piattaforma tornei Ebartex (sottodominio esterno). */
export const TOURNAMENTS_PORTAL_URL = 'https://tornei.ebartex.com';

/** Route sul portale tornei per silent login via cookie parent-domain. */
export const TOURNAMENTS_AUTH_BRIDGE_PATH = '/auth/bridge';

/** URL di ingresso al portale con SSO (cookie condiviso .ebartex.com). */
export function getTournamentsPortalUrl(returnPath = '/'): string {
  const base = TOURNAMENTS_PORTAL_URL.replace(/\/+$/, '');
  const returnTo = returnPath.startsWith('http')
    ? returnPath
    : `${base}${returnPath.startsWith('/') ? returnPath : `/${returnPath}`}`;
  return `${base}${TOURNAMENTS_AUTH_BRIDGE_PATH}?return=${encodeURIComponent(returnTo)}`;
}

export const TOURNAMENTS_PORTAL_LINK_PROPS = {
  href: getTournamentsPortalUrl('/'),
  target: '_blank',
  rel: 'noopener noreferrer',
} as const;
