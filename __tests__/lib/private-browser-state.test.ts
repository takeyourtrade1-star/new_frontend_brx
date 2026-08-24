import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getTradeProposalContext,
  setTradeProposalContext,
} from '@/lib/scambi/trade-proposal-context';
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
});
