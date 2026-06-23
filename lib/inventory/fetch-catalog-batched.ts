import { fetchCardsByBlueprintIds } from '@/lib/meilisearch-cards-by-ids';
import type { BlueprintToCardMap } from '@/lib/meilisearch-cards-by-ids';

/** Chunk API inventario (solo dati grezzi, senza catalogo). */
export const INVENTORY_API_CHUNK = 200;

/** Batch Meilisearch per arricchire le carte. */
export const CATALOG_FETCH_BATCH = 80;

export async function fetchCatalogBatched(blueprintIds: number[]): Promise<BlueprintToCardMap> {
  const unique = [...new Set(blueprintIds.filter((id) => Number.isFinite(id) && id > 0))];
  if (unique.length === 0) return {};
  const map: BlueprintToCardMap = {};
  for (let i = 0; i < unique.length; i += CATALOG_FETCH_BATCH) {
    const batch = unique.slice(i, i + CATALOG_FETCH_BATCH);
    const fetched = await fetchCardsByBlueprintIds(batch);
    Object.assign(map, fetched);
  }
  return map;
}
