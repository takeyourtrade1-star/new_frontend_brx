import type { ListingItem } from '@/lib/api/sync-client';
import type { CardCatalogHit } from '@/lib/meilisearch-cards-by-ids';
import type { CardDocument } from '@/lib/product-detail';
import type { InventoryItemWithCatalog } from '@/lib/sync/inventory-types';

function blueprintIdFromCard(card: CardDocument | null): number {
  const raw = card?.cardtrader_id;
  if (raw == null) return 0;
  if (typeof raw === 'number') return raw;
  const s = String(raw);
  return parseInt(s.includes(':') ? s.split(':')[0]! : s, 10) || 0;
}

/** Costruisce un item compatibile col modal modifica da una riga marketplace + carta corrente. */
export function listingToInventoryEditItem(
  listing: ListingItem,
  card: CardDocument | null
): InventoryItemWithCatalog {
  const blueprintId = blueprintIdFromCard(card);
  const cardHit: CardCatalogHit | null = card
    ? {
        id: card.id,
        name: card.name,
        set_name: card.set_name,
        game_slug: card.game_slug,
        image: card.image ?? null,
        cardtrader_id: blueprintId || undefined,
        keywords_localized: card.keywords_localized,
        rarity: card.rarity,
        collector_number: card.collector_number,
      }
    : null;

  return {
    id: listing.item_id,
    blueprint_id: blueprintId,
    quantity: listing.quantity,
    price_cents: listing.price_cents,
    description: null,
    graded: false,
    properties: {
      condition: listing.condition ?? undefined,
      mtg_language: listing.mtg_language ?? undefined,
    },
    updated_at: new Date().toISOString(),
    card: cardHit,
  };
}
