import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuctionUI, BidRowUI } from '@/lib/auction/auction-adapter';
import {
  enrichAuctionsWithPublicUsers,
  enrichBidRowsWithPublicUsers,
} from '@/lib/auction/public-user-enrichment';
import {
  useEnrichedAuction,
  useEnrichedAuctions,
  useEnrichedBidRows,
} from '@/lib/hooks/use-enriched-auctions';

vi.mock('@/lib/auction/public-user-enrichment', () => ({
  enrichAuctionsWithPublicUsers: vi.fn(),
  enrichBidRowsWithPublicUsers: vi.fn(),
}));

const mockedEnrichAuctions = vi.mocked(enrichAuctionsWithPublicUsers);
const mockedEnrichBidRows = vi.mocked(enrichBidRowsWithPublicUsers);

function makeAuction(numericId: number, title: string): AuctionUI {
  return {
    id: String(numericId),
    numericId,
    title,
    image: '',
    hoursFromNow: 1,
    currentBidEur: numericId * 10,
    bidCount: 0,
    seller: `seller-${numericId}`,
    sellerDisplayName: '---',
    sellerAccountType: 'personal',
    sellerCountry: 'IT',
    sellerRating: 98,
    sellerReviewCount: 0,
    game: 'mtg',
    startingBidEur: numericId,
    reservePriceEur: 0,
    status: 'live',
    winnerUsername: '---',
    endsAt: '2026-06-23T12:00:00.000Z',
    description: '',
    imageFront: '',
    imageBack: '',
    photoUrls: [],
    reservePrice: null,
    videoUrl: null,
    buyNowEnabled: false,
    buyNowPrice: null,
    buyNowUrl: null,
    winnerId: null,
    reserveNotReachedMessage: null,
    createdByUserId: `seller-${numericId}`,
    highestBidderId: null,
    startTime: '2026-06-23T11:00:00.000Z',
    condition: '',
    cardLanguage: null,
    shippingPayer: 'buyer',
    shippingOriginCountry: null,
    shippingNationalEur: null,
    shippingEuDefaultEur: null,
    shippingCountryPrices: [],
    setName: null,
    setHref: null,
    catalogGameSlug: null,
    antiSniperEnabled: false,
    antiSniperMinutes: null,
  };
}

function makeBidRow(bidId: number, amountEur: number): BidRowUI {
  return {
    bidId,
    username: `user-${bidId}`,
    displayName: '---',
    amountEur,
    createdAt: '2026-06-23T11:30:00.000Z',
    userId: `user-${bidId}`,
  };
}

describe('use-enriched-auctions hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the current auction immediately while enrichment for the new auction is pending', async () => {
    let resolveSecondEnrichment: ((value: AuctionUI[]) => void) | undefined;
    const firstAuction = makeAuction(1, 'Black Lotus');
    const secondAuction = makeAuction(2, 'Mox Sapphire');
    const enrichedFirstAuction = {
      ...firstAuction,
      sellerDisplayName: 'Venditore A',
    };
    const enrichedSecondAuction = {
      ...secondAuction,
      sellerDisplayName: 'Venditore B',
    };

    mockedEnrichAuctions
      .mockResolvedValueOnce([enrichedFirstAuction])
      .mockImplementationOnce(
        () =>
          new Promise<AuctionUI[]>((resolve) => {
            resolveSecondEnrichment = resolve;
          })
      );

    const { result, rerender } = renderHook(
      ({ base }: { base: AuctionUI | null }) => useEnrichedAuction(base),
      { initialProps: { base: firstAuction } }
    );

    await waitFor(() => expect(result.current).toEqual(enrichedFirstAuction));

    rerender({ base: secondAuction });

    expect(result.current).toEqual(secondAuction);

    resolveSecondEnrichment?.([enrichedSecondAuction]);
    await waitFor(() => expect(result.current).toEqual(enrichedSecondAuction));
  });

  it('returns current bid rows immediately when the source rows change', async () => {
    let resolveSecondEnrichment: ((value: BidRowUI[]) => void) | undefined;
    const firstRows = [makeBidRow(1, 10)];
    const secondRows = [makeBidRow(2, 25)];
    const enrichedFirstRows = [{ ...firstRows[0], displayName: 'Offerente A' }];
    const enrichedSecondRows = [{ ...secondRows[0], displayName: 'Offerente B' }];

    mockedEnrichBidRows
      .mockResolvedValueOnce(enrichedFirstRows)
      .mockImplementationOnce(
        () =>
          new Promise<BidRowUI[]>((resolve) => {
            resolveSecondEnrichment = resolve;
          })
      );

    const { result, rerender } = renderHook(
      ({ rows }: { rows: BidRowUI[] }) => useEnrichedBidRows(rows),
      { initialProps: { rows: firstRows } }
    );

    await waitFor(() => expect(result.current).toEqual(enrichedFirstRows));

    rerender({ rows: secondRows });

    expect(result.current).toEqual(secondRows);

    resolveSecondEnrichment?.(enrichedSecondRows);
    await waitFor(() => expect(result.current).toEqual(enrichedSecondRows));
  });

  it('returns the current auction list immediately when the source list changes', async () => {
    let resolveSecondEnrichment: ((value: AuctionUI[]) => void) | undefined;
    const firstList = [makeAuction(1, 'Black Lotus')];
    const secondList = [makeAuction(2, 'Mox Sapphire')];
    const enrichedFirstList = [{ ...firstList[0], sellerDisplayName: 'Venditore A' }];
    const enrichedSecondList = [{ ...secondList[0], sellerDisplayName: 'Venditore B' }];

    mockedEnrichAuctions
      .mockResolvedValueOnce(enrichedFirstList)
      .mockImplementationOnce(
        () =>
          new Promise<AuctionUI[]>((resolve) => {
            resolveSecondEnrichment = resolve;
          })
      );

    const { result, rerender } = renderHook(
      ({ rows }: { rows: AuctionUI[] }) => useEnrichedAuctions(rows),
      { initialProps: { rows: firstList } }
    );

    await waitFor(() => expect(result.current).toEqual(enrichedFirstList));

    rerender({ rows: secondList });

    expect(result.current).toEqual(secondList);

    resolveSecondEnrichment?.(enrichedSecondList);
    await waitFor(() => expect(result.current).toEqual(enrichedSecondList));
  });
});
