import { config } from '@/lib/config';
import { getTournamentsPortalUrl } from '@/lib/config/tournaments';

const SSO_REFRESH_TIMEOUT_MS = 2500;

function isEbartexProductionHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'ebartex.com' || host.endsWith('.ebartex.com');
}

async function refreshTournamentsSsoCookie(refreshToken: string): Promise<void> {
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
    // If cookie sync fails or times out, still let the user reach the portal.
  } finally {
    window.clearTimeout(timeoutId);
  }
}

/**
 * Naviga al portale tornei. Su ebartex.com prova a rinnovare i cookie SSO
 * prima del redirect, cosi' il Set-Cookie condiviso viene applicato.
 */
export async function navigateToTournamentsPortal(returnPath = '/'): Promise<void> {
  if (typeof window === 'undefined') return;

  const targetUrl = getTournamentsPortalUrl(returnPath);

  if (isEbartexProductionHost()) {
    const refreshToken = localStorage.getItem(config.auth.refreshTokenKey);
    if (refreshToken) {
      await refreshTournamentsSsoCookie(refreshToken);
    }
  }

  window.location.replace(targetUrl);
}
