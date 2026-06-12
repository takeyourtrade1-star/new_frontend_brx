import { config } from '@/lib/config';
import { getTournamentsPortalUrl } from '@/lib/config/tournaments';

const SSO_REFRESH_TIMEOUT_MS = 4000;

function isEbartexProductionHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'ebartex.com' || host.endsWith('.ebartex.com');
}

export async function refreshTournamentsSsoCookies(refreshToken: string): Promise<void> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), SSO_REFRESH_TIMEOUT_MS);

  try {
    await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
      credentials: 'same-origin',
      signal: controller.signal,
    });
  } catch {
    // If refresh fails, keep the portal reachable; it can still fall back to login.
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function syncTournamentsSsoCookiesBeforeRedirect(): Promise<void> {
  if (!isEbartexProductionHost()) return;

  const refreshToken = localStorage.getItem(config.auth.refreshTokenKey);
  if (!refreshToken) return;

  await refreshTournamentsSsoCookies(refreshToken);
}

/**
 * Naviga al portale tornei. Su ebartex.com prova a rinnovare i cookie SSO
 * prima del redirect, così i Set-Cookie parent-domain arrivano al portale.
 */
export async function navigateToTournamentsPortal(returnPath = '/'): Promise<void> {
  if (typeof window === 'undefined') return;

  const targetUrl = getTournamentsPortalUrl(returnPath);

  await syncTournamentsSsoCookiesBeforeRedirect();
  window.location.replace(targetUrl);
}
