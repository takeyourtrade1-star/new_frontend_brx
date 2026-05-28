'use client';

const SESSION_SKIP_KEY = 'ebartex.sellGuide.skipped';

export function isSellGuideSkippedThisSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(SESSION_SKIP_KEY) === '1';
  } catch {
    return false;
  }
}

export function skipSellGuideForSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_SKIP_KEY, '1');
  } catch {
    /* ignore quota / private mode */
  }
}
