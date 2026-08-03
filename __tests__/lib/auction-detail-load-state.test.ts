import { describe, expect, it } from 'vitest';
import { resolveAuctionDetailLoadState } from '@/lib/auction/auction-detail-load-state';

describe('auction detail load state', () => {
  it('shows loading only while a valid request is pending without data', () => {
    expect(
      resolveAuctionDetailLoadState({
        hasDetail: false,
        isLoading: true,
        isError: false,
        isValidAuctionId: true,
      }),
    ).toBe('loading');
  });

  it.each([
    ['404/500 response', true, false, true],
    ['settled response without detail', false, false, true],
    ['invalid route id', false, false, false],
  ])('shows a retryable error for a %s', (_label, isError, isLoading, isValidAuctionId) => {
    expect(
      resolveAuctionDetailLoadState({
        hasDetail: false,
        isLoading,
        isError,
        isValidAuctionId,
      }),
    ).toBe('error');
  });

  it('renders available base detail despite enrichment or background-refetch failure', () => {
    expect(
      resolveAuctionDetailLoadState({
        hasDetail: true,
        isLoading: false,
        isError: true,
        isValidAuctionId: true,
      }),
    ).toBe('ready');
  });
});
