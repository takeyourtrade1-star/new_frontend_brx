import type { InventoryItemResponse } from '@/lib/api/sync-client';
import type { CardCatalogHit } from '@/lib/meilisearch-cards-by-ids';
import type { SyncMode } from '@/lib/api/marketplace-client';

export type InventoryListingSource = 'sync' | 'marketplace';

/** Riga inventario arricchita con dati catalogo (Oggetti, dettaglio prodotto). */
export type InventoryItemWithCatalog = InventoryItemResponse & {
  card?: CardCatalogHit | null;
  /** sync = import CardTrader; marketplace = listing EBARTEX (Vendi) */
  listing_source?: InventoryListingSource;
  marketplace_listing_id?: string;
  sync_mode_at_creation?: SyncMode;
  card_id?: string;
};

export function isMarketplaceInventoryItem(item: InventoryItemWithCatalog): boolean {
  return item.listing_source === 'marketplace' && Boolean(item.marketplace_listing_id);
}

/** Listing creato in modalità DEMO: solo su EBARTEX, non su CardTrader. */
export function isDemoEbartexListing(item: InventoryItemWithCatalog): boolean {
  return isMarketplaceInventoryItem(item) && item.sync_mode_at_creation === 'demo';
}
