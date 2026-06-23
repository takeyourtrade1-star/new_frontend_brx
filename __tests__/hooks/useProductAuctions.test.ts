import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useProductAuctions } from '@/hooks/product/useProductAuctions';
import { useAuctionList } from '@/lib/hooks/use-auctions';
import { useEnrichedCardAuctions } from '@/lib/hooks/use-enriched-card-auctions';
import { apiToAuctionUI } from '@/lib/auction/auction-adapter';
import type { CardDocument } from '@/lib/product-detail';

vi.mock('@/lib/hooks/use-auctions', () => ({ useAuctionList: vi.fn() }));
vi.mock('@/lib/hooks/use-enriched-card-auctions', () => ({ useEnrichedCardAuctions: vi.fn() }));
vi.mock('@/lib/auction/auction-adapter', () => ({ apiToAuctionUI: vi.fn() }));

const card = { id: 'c1', name: 'Black Lotus' } as unknown as CardDocument;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(apiToAuctionUI).mockImplementation((a: unknown) => ({ ui: a }) as never);
  vi.mocked(useEnrichedCardAuctions).mockImplementation((base) => base as never);
});

describe('useProductAuctions', () => {
  it('interroga le aste attive per nome carta e mappa i risultati', () => {
    vi.mocked(useAuctionList).mockReturnValue({
      data: { data: [{ id: 'a1' }, { id: 'a2' }] },
      isLoading: false,
    } as never);

    const { result } = renderHook(() => useProductAuctions(card));

    expect(useAuctionList).toHaveBeenCalledWith(
      { q: 'Black Lotus', status: 'ACTIVE', limit: 20 },
      { enabled: true }
    );
    expect(apiToAuctionUI).toHaveBeenCalledTimes(2);
    expect(result.current.enrichedCardAuctions).toHaveLength(2);
    expect(result.current.auctionsLoading).toBe(false);
  });

  it('disabilita la query quando non c\'è un nome carta', () => {
    vi.mocked(useAuctionList).mockReturnValue({ data: undefined, isLoading: false } as never);

    const { result } = renderHook(() => useProductAuctions(undefined));

    expect(useAuctionList).toHaveBeenCalledWith(
      { q: undefined, status: 'ACTIVE', limit: 20 },
      { enabled: false }
    );
    expect(result.current.enrichedCardAuctions).toHaveLength(0);
  });
});
