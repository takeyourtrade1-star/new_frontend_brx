import { config } from '@/lib/config';
import { getTournamentsPortalUrl } from '@/lib/config/tournaments';

const SSO_SYNC_TIMEOUT_MS = 2500;

function isEbartexProductionHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'ebartex.com' || host.endsWith('.ebartex.com');
}

async function syncTournamentsSsoCookie(): Promise<void> {
  if (!isEbartexProductionHost()) return;

  const refreshToken = localStorage.getItem(config.auth.refreshTokenKey);
  if (!refreshToken) return;

  const refreshRequest = fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
    credentials: 'same-origin',
  })
    .then(() => undefined)
    .catch(() => undefined);

  await Promise.race([
    refreshRequest,
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, SSO_SYNC_TIMEOUT_MS);
    }),
  ]);
}

/**
 * Naviga al portale tornei. Su ebartex.com prova a rinnovare i cookie SSO
 * prima del redirect, così il portale trova i cookie condivisi aggiornati.
 */
export async function navigateToTournamentsPortal(returnPath = '/'): Promise<void> {
  if (typeof window === 'undefined') return;

  const targetUrl = getTournamentsPortalUrl(returnPath);

  await syncTournamentsSsoCookie();
  window.location.replace(targetUrl);
}
