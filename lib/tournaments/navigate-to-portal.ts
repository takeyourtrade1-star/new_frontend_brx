import { config } from '@/lib/config';
import { getTournamentsPortalUrl } from '@/lib/config/tournaments';
import { tokenManager } from '@/lib/api/refresh-token';

function isEbartexProductionHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'ebartex.com' || host.endsWith('.ebartex.com');
}

/**
 * Naviga al portale tornei. Su ebartex.com rinnova prima la sessione same-origin
 * in modo che i cookie SSO parent-domain siano presenti sul sottodominio tornei.
 */
export async function navigateToTournamentsPortal(returnPath = '/'): Promise<void> {
  if (typeof window === 'undefined') return;

  const targetUrl = getTournamentsPortalUrl(returnPath);

  if (isEbartexProductionHost()) {
    const refreshToken = localStorage.getItem(config.auth.refreshTokenKey);
    if (refreshToken) {
      await tokenManager.ensureFreshToken().catch(() => null);
    }
  }

  window.location.replace(targetUrl);
}
