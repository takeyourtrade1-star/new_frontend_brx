import type { InventoryItemResponse } from '@/lib/api/sync-client';
import type { ListingResponse } from '@/lib/api/marketplace-client';
import { mapListingResponseToInventoryItem } from '@/lib/marketplace/listing-map';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';

/**
 * Riga sync realmente gestita dal sync CardTrader.
 */
export function isCardTraderSyncRow(item: InventoryItemResponse): boolean {
  return item.source === 'cardtrader';
}

/** Stock reale visibile e scambiabile: CardTrader oppure accreditato da uno scambio. */
export function isTradableSyncRow(item: InventoryItemResponse): boolean {
  return item.source === 'cardtrader' || item.source === 'trade';
}

/**
 * Compone la proiezione inventario di /account/oggetti da righe sync CardTrader
 * e listing marketplace EBARTEX, senza merge cieco (piano CardTrader, Fase 8):
 *
 * - righe sync senza `external_stock_id` (interne/test) → escluse;
 * - righe sync a quantità zero (sold out) → escluse dall'inventario attivo;
 * - listing marketplace EBARTEX attivi, anche senza CardTrader → inclusi;
 * - listing marketplace già collegati a una riga sync tramite
 *   `cardtrader_article_id` ↔ `external_stock_id` → esclusi (stesso stock
 *   fisico: la riga sync è la fonte autorevole per lo stato CardTrader).
 */
export function composeAccountInventory(
  syncItems: InventoryItemResponse[],
  marketplaceListings: ListingResponse[]
): InventoryItemWithCatalog[] {
  const tradableRows: InventoryItemWithCatalog[] = syncItems
    .filter(isTradableSyncRow)
    .filter((item) => (item.quantity ?? 0) > 0)
    .map((item) => ({ ...item, listing_source: 'sync' as const }));

  const knownExternalIds = new Set(
    tradableRows
      .filter(isCardTraderSyncRow)
      .map((item) => String(item.external_stock_id))
  );

  const marketplaceRows = marketplaceListings
    .filter(
      (listing) =>
        listing.cardtrader_article_id == null ||
        !knownExternalIds.has(String(listing.cardtrader_article_id))
    )
    .map(mapListingResponseToInventoryItem);

  return [...tradableRows, ...marketplaceRows];
}
