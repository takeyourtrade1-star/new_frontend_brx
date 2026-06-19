import { getTournamentsPortalUrl } from '@/lib/config/tournaments';

/**
 * Naviga al portale tornei esterno (tornei.ebartex.com).
 *
 * NON sincronizza la sessione SSO del marketplace: l'utente deve effettuare
 * un nuovo login sul portale tornei (comportamento voluto). In passato qui si
 * rinnovavano i cookie SSO (.ebartex.com) per riusare la sessione senza nuovo
 * login: rimosso di proposito.
 */
export function navigateToTournamentsPortal(returnPath = '/'): void {
  if (typeof window === 'undefined') return;
  window.location.replace(getTournamentsPortalUrl(returnPath));
}
