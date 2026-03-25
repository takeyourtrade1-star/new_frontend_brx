export type AsteViewMode = 'list' | 'grid';

const PREFIX = 'brx_aste_view_';

export function getStoredAsteViewMode(key: string, fallback: AsteViewMode = 'grid'): AsteViewMode {
  if (typeof window === 'undefined') return fallback;
  const v = window.localStorage.getItem(PREFIX + key);
  return v === 'list' || v === 'grid' ? v : fallback;
}

export function setStoredAsteViewMode(key: string, mode: AsteViewMode): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PREFIX + key, mode);
}
