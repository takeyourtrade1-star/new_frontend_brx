import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useMarketplaceListings } from '@/lib/hooks/use-marketplace-listings';
import type { ListingItem } from '@/lib/api/sync-client';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useQueryClient: vi.fn(),
}));

const marketplaceListing = (id: string): ListingItem => ({
  item_id: id === 'listing-a' ? 1 : 2,
  marketplace_listing_id: id,
  listing_source: 'marketplace',
  seller_id: `seller-${id}`,
  seller_display_name: `Venditore ${id}`,
  country: 'IT',
  quantity: 1,
  price_cents: 250,
  condition: 'Near Mint',
  mtg_language: 'en',
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useQueryClient).mockReturnValue({
    invalidateQueries: vi.fn(),
  } as never);
});

describe('useMarketplaceListings', () => {
  it('carica le cover in una query separata senza bloccare le righe venditore', () => {
    const rawListings = [marketplaceListing('listing-b'), marketplaceListing('listing-a')];
    vi.mocked(useQuery)
      .mockReturnValueOnce({ data: rawListings, isLoading: false, error: null } as never)
      .mockReturnValueOnce({ data: undefined } as never)
      .mockReturnValueOnce({ data: undefined, isLoading: true, error: null } as never);

    const { result } = renderHook(() => useMarketplaceListings(123, 'card-1'));

    expect(result.current.listings).toEqual(rawListings);
    expect(result.current.listingsLoading).toBe(false);
    expect(result.current.listingCoverPhotos).toEqual({});

    const coverQueryOptions = vi.mocked(useQuery).mock.calls[2]?.[0];
    expect(coverQueryOptions).toMatchObject({
      queryKey: [
        'product-detail',
        'listing-cover-photos',
        'listing-a',
        'listing-b',
      ],
      enabled: true,
      staleTime: 300_000,
      retry: expect.any(Function),
      placeholderData: expect.any(Function),
    });

    const retry = coverQueryOptions?.retry as (
      failureCount: number,
      error: Error & { status?: number },
    ) => boolean;
    expect(retry(0, Object.assign(new Error('upstream'), { status: 502 }))).toBe(true);
    expect(retry(1, Object.assign(new Error('upstream'), { status: 502 }))).toBe(false);
    expect(retry(0, Object.assign(new Error('bad request'), { status: 400 }))).toBe(false);
  });
});
