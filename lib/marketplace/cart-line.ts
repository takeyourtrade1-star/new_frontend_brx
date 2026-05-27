import type { ListingItem } from '@/lib/api/sync-client';
import type { CartSellerAccountType, MarketplaceCartLine } from '@/types';
import { isMarketplaceListingItem } from '@/lib/marketplace/listing-map';

function resolveSellerAccountType(
  raw: string | null | undefined,
): CartSellerAccountType | null {
  if (raw === 'business' || raw === 'personal') return raw;
  return null;
}

export function buildMarketplaceCartLine(
  item: ListingItem,
  quantity: number,
  ctx: { title: string; imageUrl: string; blueprintId?: number },
): MarketplaceCartLine {
  const listingId = item.marketplace_listing_id;
  if (!listingId) {
    throw new Error('Missing marketplace_listing_id');
  }
  const safeQty = Math.max(1, Math.min(quantity, item.quantity));
  return {
    lineId: `marketplace-${listingId}`,
    source: 'marketplace',
    listingId,
    sellerId: item.seller_id,
    sellerDisplayName: item.seller_display_name,
    sellerAccountType: resolveSellerAccountType(item.seller_account_type),
    blueprintId: ctx.blueprintId,
    title: ctx.title,
    imageUrl: ctx.imageUrl,
    priceCents: item.price_cents,
    quantity: safeQty,
    maxQuantity: item.quantity,
    condition: item.condition,
    language: item.mtg_language,
  };
}

export function buildCartLineFromListingItem(
  item: ListingItem,
  quantity: number,
  ctx: { title: string; imageUrl: string; blueprintId?: number },
): MarketplaceCartLine {
  if (isMarketplaceListingItem(item)) {
    return buildMarketplaceCartLine(item, quantity, ctx);
  }
  return buildSyncCartLine(item, quantity, ctx);
}

export function buildSyncCartLine(
  item: ListingItem,
  quantity: number,
  ctx: { title: string; imageUrl: string; blueprintId?: number },
): MarketplaceCartLine {
  const safeQty = Math.max(1, Math.min(quantity, item.quantity));
  return {
    lineId: `sync-${item.seller_id}-${item.item_id}`,
    source: 'sync',
    listingId: item.item_id,
    sellerId: item.seller_id,
    sellerDisplayName: item.seller_display_name,
    sellerAccountType: resolveSellerAccountType(item.seller_account_type),
    blueprintId: ctx.blueprintId,
    title: ctx.title,
    imageUrl: ctx.imageUrl,
    priceCents: item.price_cents,
    quantity: safeQty,
    maxQuantity: item.quantity,
    condition: item.condition,
    language: item.mtg_language,
  };
}
