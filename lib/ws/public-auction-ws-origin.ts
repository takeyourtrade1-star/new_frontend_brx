const PRODUCTION_AUCTION_WS_ORIGIN = 'wss://auction.ebartex.com';

/**
 * Validate the only cross-origin browser service that cannot use an HTTP BFF:
 * live auction/dispute WebSockets. Production is deliberately pinned to the
 * public auction host so an env injection cannot turn tickets into SSRF-like
 * capabilities for an attacker-controlled socket.
 */
export function publicAuctionWsOrigin(
  raw = process.env.NEXT_PUBLIC_AUCTION_WS_URL || '',
): string {
  if (!raw || raw.length > 512) return '';
  try {
    const url = new URL(raw);
    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      (url.pathname !== '/' && url.pathname !== '')
    ) {
      return '';
    }
    if (process.env.NODE_ENV === 'production') {
      return url.origin === PRODUCTION_AUCTION_WS_ORIGIN ? url.origin : '';
    }
    if (url.origin === PRODUCTION_AUCTION_WS_ORIGIN) return url.origin;
    if (
      url.protocol === 'ws:' &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]')
    ) {
      return url.origin;
    }
    return '';
  } catch {
    return '';
  }
}
