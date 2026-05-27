import type { ListingItem } from '@/lib/api/sync-client';
import type { ListingResponse, PublicListingResponse } from '@/lib/api/marketplace-client';
import { marketplaceConditionToSync } from '@/lib/marketplace/condition-map';
import { normalizeCardLanguageCode } from '@/lib/card-languages';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';

/** Stable row/cart key for sync inventory vs marketplace UUID listings. */
export function listingRowKey(item: ListingItem): string {
  if (item.listing_source === 'marketplace' && item.marketplace_listing_id) {
    return `mkt:${item.marketplace_listing_id}`;
  }
  return `sync:${item.item_id}`;
}

function uuidToSyntheticItemId(uuid: string): number {
  let h = 0;
  for (let i = 0; i < uuid.length; i++) {
    h = (Math.imul(31, h) + uuid.charCodeAt(i)) | 0;
  }
  return Math.abs(h) || 1;
}

export function mapPublicListingToListingItem(pub: PublicListingResponse): ListingItem {
  const priceNum = Number.parseFloat(pub.price);
  const price_cents = Number.isFinite(priceNum) ? Math.round(priceNum * 100) : 0;
  return {
    item_id: uuidToSyntheticItemId(pub.id),
    marketplace_listing_id: pub.id,
    listing_source: 'marketplace',
    seller_id: pub.seller_id,
    seller_display_name: pub.seller_id,
    country: null,
    quantity: pub.quantity,
    price_cents,
    condition: marketplaceConditionToSync(pub.condition),
    mtg_language: normalizeCardLanguageCode(pub.language) || pub.language,
    description: pub.title,
  };
}

export function isMarketplaceListingItem(item: ListingItem): boolean {
  return item.listing_source === 'marketplace' && Boolean(item.marketplace_listing_id);
}

/** Converte un listing marketplace (mio) in riga inventario per /account/oggetti. */
export function mapListingResponseToInventoryItem(listing: ListingResponse): InventoryItemWithCatalog {
  const priceNum = Number.parseFloat(listing.price);
  const price_cents = Number.isFinite(priceNum) ? Math.round(priceNum * 100) : 0;
  const blueprintId = listing.cardtrader_blueprint_id ?? 0;
  return {
    id: uuidToSyntheticItemId(listing.id),
    blueprint_id: blueprintId,
    quantity: listing.quantity,
    price_cents,
    description: listing.title,
    graded: false,
    properties: {
      condition: marketplaceConditionToSync(listing.condition),
      mtg_language: normalizeCardLanguageCode(listing.language) || listing.language,
    },
    external_stock_id: null,
    updated_at: listing.updated_at,
    created_at: listing.created_at,
    listing_source: 'marketplace',
    marketplace_listing_id: listing.id,
    sync_mode_at_creation: listing.sync_mode_at_creation,
    card_id: listing.card_id,
  };
}
