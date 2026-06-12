import { config } from '@/lib/config';
import { getTournamentsPortalUrl } from '@/lib/config/tournaments';

/**
 * Sincronizza i cookie SSO (Domain=.ebartex.com) e naviga al portale tornei.
 * Se l'utente è loggato sul marketplace, il bridge su tornei.ebartex.com
 * riusa il refresh token condiviso senza nuovo login.
 */
export async function navigateToTournamentsPortal(returnPath = '/'): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const refreshToken = localStorage.getItem(config.auth.refreshTokenKey);
    if (refreshToken) {
      await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
        credentials: 'same-origin',
      });
    } else {
      await fetch('/api/auth/bridge', { credentials: 'same-origin' });
    }
  } catch {
    // Il bridge tornei gestisce anche utenti ospite o cookie già presenti.
  }

  window.location.replace(getTournamentsPortalUrl(returnPath));
}
