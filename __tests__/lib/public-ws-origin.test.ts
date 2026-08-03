import { afterEach, describe, expect, it, vi } from 'vitest';

import { publicAuctionWsOrigin } from '@/lib/ws/public-auction-ws-origin';

afterEach(() => vi.unstubAllEnvs());

describe('public auction WebSocket origin', () => {
  it('pins production to the sole CSP-allowed WSS origin', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(publicAuctionWsOrigin('wss://auction.ebartex.com')).toBe(
      'wss://auction.ebartex.com',
    );
    expect(publicAuctionWsOrigin('wss://evil.ebartex.com')).toBe('');
    expect(publicAuctionWsOrigin('ws://auction.ebartex.com')).toBe('');
    expect(publicAuctionWsOrigin('wss://user:pass@auction.ebartex.com')).toBe('');
    expect(publicAuctionWsOrigin('wss://auction.ebartex.com/other')).toBe('');
  });

  it('allows only loopback ws during local development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(publicAuctionWsOrigin('ws://127.0.0.1:8003')).toBe('ws://127.0.0.1:8003');
    expect(publicAuctionWsOrigin('ws://localhost')).toBe('ws://localhost');
    expect(publicAuctionWsOrigin('ws://attacker.test')).toBe('');
  });
});
