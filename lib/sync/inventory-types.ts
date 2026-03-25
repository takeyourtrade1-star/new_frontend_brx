import type { InventoryItemResponse } from '@/lib/api/sync-client';
import type { CardCatalogHit } from '@/lib/meilisearch-cards-by-ids';

/** Riga inventario arricchita con dati catalogo (Oggetti, dettaglio prodotto). */
export type InventoryItemWithCatalog = InventoryItemResponse & { card?: CardCatalogHit | null };
