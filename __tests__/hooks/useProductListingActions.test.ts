import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useProductListingActions } from '@/hooks/product/useProductListingActions';
import { cancelListing, updateListing } from '@/lib/api/marketplace-client';
import { isMarketplaceListingItem } from '@/lib/marketplace/listing-map';
import type { ListingItem } from '@/lib/api/sync-client';

vi.mock('@/lib/api/marketplace-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/marketplace-client')>();
  return { ...actual, cancelListing: vi.fn(), updateListing: vi.fn() };
});
vi.mock('@/lib/marketplace/listing-map', () => ({
  isMarketplaceListingItem: vi.fn(),
  listingRowKey: (item: ListingItem) => `key-${item.marketplace_listing_id ?? item.item_id}`,
}));
vi.mock('@/lib/product-detail/listing-to-inventory-item', () => ({
  listingToInventoryEditItem: vi.fn(() => ({ id: 1 })),
}));

const baseArgs = () => ({
  userId: 'u1',
  accessToken: 'tok',
  card: { id: 'c1', name: 'Sol Ring' } as never,
  refetchListings: vi.fn().mockResolvedValue(undefined),
  pollSyncTaskThenRefresh: vi.fn().mockResolvedValue(undefined),
  setListingActionMessage: vi.fn(),
});

beforeEach(() => vi.clearAllMocks());

describe('useProductListingActions', () => {
  it('blocca handleOwnerQtyDelta senza autenticazione', async () => {
    const args = { ...baseArgs(), userId: undefined };
    const { result } = renderHook(() => useProductListingActions(args));

    await act(async () => {
      await result.current.handleOwnerQtyDelta({ quantity: 2 } as ListingItem, 1);
    });

    expect(args.setListingActionMessage).toHaveBeenCalledWith(
      'Accedi per gestire le tue inserzioni.'
    );
    expect(updateListing).not.toHaveBeenCalled();
  });

  it('aumenta la quantità di un\'inserzione marketplace e ricarica', async () => {
    vi.mocked(isMarketplaceListingItem).mockReturnValue(true);
    const args = baseArgs();
    const { result } = renderHook(() => useProductListingActions(args));

    const item = { marketplace_listing_id: 'm1', quantity: 2 } as ListingItem;
    await act(async () => {
      await result.current.handleOwnerQtyDelta(item, 1);
    });

    expect(updateListing).toHaveBeenCalledWith('m1', { quantity: 3 });
    expect(cancelListing).not.toHaveBeenCalled();
    expect(args.refetchListings).toHaveBeenCalled();
  });

  it('apre il modale marketplace su handleMarketplaceOwnerEdit', () => {
    vi.mocked(isMarketplaceListingItem).mockReturnValue(true);
    const args = baseArgs();
    const { result } = renderHook(() => useProductListingActions(args));

    act(() => {
      result.current.handleMarketplaceOwnerEdit({
        marketplace_listing_id: 'm9',
        description: 'Mia carta',
        price_cents: 1500,
        quantity: 4,
      } as ListingItem);
    });

    expect(result.current.editingMarketplace).toEqual({
      id: 'm9',
      title: 'Mia carta',
      price: '15.00',
      quantity: 4,
    });
  });
});
