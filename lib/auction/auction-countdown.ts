const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_HOUR = 60 * 60 * 1000;

/** Tempo rimanente superiore a 24 ore → formato giorni + ore. */
export function isAuctionCountdownLong(ms: number): boolean {
  return ms > MS_PER_DAY;
}

/**
 * Countdown asta: oltre 24h mostra giorni + ore (es. `3g 12h`),
 * altrimenti ore:minuti:secondi (es. `05:42:18`).
 */
export function formatAuctionCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';

  if (ms > MS_PER_DAY) {
    const totalHours = Math.floor(ms / MS_PER_HOUR);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    return `${days}g ${hours}h`;
  }

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':');
}

/** Alias usato nelle liste e hub aste. */
export const formatHMS = formatAuctionCountdown;
