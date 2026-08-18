'use client';

const STORAGE_PREFIX = 'brx_video_intro_seen_';

export type VideoIntroFeature = 'scambi' | 'aste' | 'tornei';

/**
 * Controlla se l'utente (o il browser guest) ha già visualizzato il video introduttivo della feature.
 */
export function hasSeenVideoIntro(feature: VideoIntroFeature, userId?: string | number | null): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const guestKey = `${STORAGE_PREFIX}${feature}_guest`;
    if (localStorage.getItem(guestKey) === '1') {
      return true;
    }
    if (userId) {
      const userKey = `${STORAGE_PREFIX}${feature}_${userId}`;
      if (localStorage.getItem(userKey) === '1') {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Salva che l'utente ha visto o saltato il video introduttivo della feature (1 sola volta per account/browser).
 */
export function markVideoIntroSeen(feature: VideoIntroFeature, userId?: string | number | null): void {
  if (typeof window === 'undefined') return;
  try {
    const guestKey = `${STORAGE_PREFIX}${feature}_guest`;
    localStorage.setItem(guestKey, '1');
    if (userId) {
      const userKey = `${STORAGE_PREFIX}${feature}_${userId}`;
      localStorage.setItem(userKey, '1');
    }
  } catch {
    // Ignora errori di storage (es. quota o private mode restrizioni)
  }
}
