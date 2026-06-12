import { config } from '@/lib/config';
import { getTournamentsPortalUrl } from '@/lib/config/tournaments';

function isEbartexProductionHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'ebartex.com' || host.endsWith('.ebartex.com');
}

/**
 * Naviga al portale tornei. Su ebartex.com prova a rinnovare i cookie SSO
 * in background (non blocca) prima del redirect.
 */
export function navigateToTournamentsPortal(returnPath = '/'): void {
  if (typeof window === 'undefined') return;

  const targetUrl = getTournamentsPortalUrl(returnPath);

  if (isEbartexProductionHost()) {
    const refreshToken = localStorage.getItem(config.auth.refreshTokenKey);
    if (refreshToken) {
      void fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
        credentials: 'same-origin',
        keepalive: true,
      }).catch(() => undefined);
    }
  }

  window.location.replace(targetUrl);
}
