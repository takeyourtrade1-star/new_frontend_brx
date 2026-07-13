import type { InventoryItemResponse } from '@/lib/api/sync-client';
import type { ListingResponse } from '@/lib/api/marketplace-client';
import { mapListingResponseToInventoryItem } from '@/lib/marketplace/listing-map';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';

/**
 * Riga sync realmente gestita dal sync CardTrader.
 * Le righe senza `external_stock_id` sono create internamente (test/mock) e il
 * sync non le tocca mai: non rappresentano stock CardTrader e non vanno mostrate
 * nella proiezione inventario (piano CardTrader, Fase 8).
 */
export function isCardTraderSyncRow(item: InventoryItemResponse): boolean {
  return item.external_stock_id != null && String(item.external_stock_id).trim() !== '';
}

/** Listing marketplace creato in modalità DEMO: mock di test, escluso dalla proiezione. */
export function isDemoListing(listing: ListingResponse): boolean {
  return listing.sync_mode_at_creation === 'demo';
}

/**
 * Compone la proiezione inventario di /account/oggetti da righe sync CardTrader
 * e listing marketplace EBARTEX, senza merge cieco (piano CardTrader, Fase 8):
 *
 * - righe sync senza `external_stock_id` (interne/test) → escluse;
 * - righe sync a quantità zero (sold out) → escluse dall'inventario attivo;
 * - listing marketplace creati in DEMO (mock) → esclusi (restano gestibili
 *   nel pannello Vendite);
 * - listing marketplace già collegati a una riga sync tramite
 *   `cardtrader_article_id` ↔ `external_stock_id` → esclusi (stesso stock
 *   fisico: la riga sync è la fonte autorevole per lo stato CardTrader).
 */
export function composeAccountInventory(
  syncItems: InventoryItemResponse[],
  marketplaceListings: ListingResponse[]
): InventoryItemWithCatalog[] {
  const cardtraderRows: InventoryItemWithCatalog[] = syncItems
    .filter(isCardTraderSyncRow)
    .filter((item) => (item.quantity ?? 0) > 0)
    .map((item) => ({ ...item, listing_source: 'sync' as const }));

  const knownExternalIds = new Set(
    cardtraderRows.map((item) => String(item.external_stock_id))
  );

  const marketplaceRows = marketplaceListings
    .filter((listing) => !isDemoListing(listing))
    .filter(
      (listing) =>
        listing.cardtrader_article_id == null ||
        !knownExternalIds.has(String(listing.cardtrader_article_id))
    )
    .map(mapListingResponseToInventoryItem);

  return [...cardtraderRows, ...marketplaceRows];
}
