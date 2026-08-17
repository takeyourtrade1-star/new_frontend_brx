import { getTournamentsPortalUrl } from '@/lib/config/tournaments';

/**
 * Naviga al portale tornei esterno (tornei.ebartex.com).
 *
 * Il bridge usa un authorization code monouso con PKCE. I cookie restano
 * host-only e nessun access/refresh token passa tra i siti via URL o JavaScript.
 */
export function navigateToTournamentsPortal(returnPath = '/'): void {
  if (typeof window === 'undefined') return;
  window.location.replace(getTournamentsPortalUrl(returnPath));
}
