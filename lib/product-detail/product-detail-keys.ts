import type { CardDocument } from '@/lib/product-detail';

export const productDetailKeys = {
  all: ['product-detail'] as const,
  reprints: (card: CardDocument | undefined) =>
    [
      ...productDetailKeys.all,
      'reprints',
      card?.id,
      card?.oracle_id,
      card?.card_id,
      card?.game_slug,
      card?.category_id,
    ] as const,
  listings: (blueprintId: number) =>
    [...productDetailKeys.all, 'listings', blueprintId] as const,
  sellerProfiles: (sellerIds: string[]) =>
    [...productDetailKeys.all, 'seller-profiles', ...sellerIds] as const,
  auctionInventory: (userId: string, blueprintId: number) =>
    [...productDetailKeys.all, 'auction-inventory', userId, blueprintId] as const,
  enrichedAuctions: (auctionIds: string[]) =>
    [...productDetailKeys.all, 'enriched-auctions', ...auctionIds] as const,
};
