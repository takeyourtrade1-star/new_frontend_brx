import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getTradeProposalContext,
  setTradeProposalContext,
} from '@/lib/scambi/trade-proposal-context';
import {
  scanSessionStorageKey,
  validOwnedScanSession,
} from '@/lib/scanner/scan-session-store';

beforeEach(() => {
  sessionStorage.clear();
  vi.useRealTimers();
});

const context = {
  seller: { name: 'A', isPro: false, country: 'IT' },
  card: {
    blueprintId: 1,
    id: '1',
    name: 'Card',
    image: '/card.jpg',
    condition: 'near_mint',
    priceEur: 1,
    game: 'mtg',
  },
  listing: { id: '1', source: 'sync' as const, sellerId: 'seller', quantity: 1 },
};

describe('account-scoped private browser state', () => {
  it('never exposes a trade proposal to a different principal', () => {
    setTradeProposalContext('user-a', context);
    expect(getTradeProposalContext('user-b')).toBeNull();
    expect(sessionStorage.getItem('ebartex_trade_proposal_ctx')).toBeNull();
  });

  it('rejects expired and cross-owner scan-session envelopes', () => {
    const session = { id: 'scan-a', items: [] } as never;
    const envelope = {
      schemaVersion: 1,
      ownerId: 'user-a',
      expiresAt: 2_000,
      session,
    };
    expect(scanSessionStorageKey('user-a')).toBe('active:user-a');
    expect(validOwnedScanSession(envelope, 'user-b', 1_000)).toBeNull();
    expect(validOwnedScanSession(envelope, 'user-a', 2_001)).toBeNull();
    expect(validOwnedScanSession(envelope, 'user-a', 1_000)).toBe(session);
    expect(validOwnedScanSession(session, 'user-a', 1_000)).toBeNull();
  });
});
