/**
 * Fetch card/catalog data from Meilisearch by blueprint_id (or numeric id).
 * Used to enrich inventory items with name, set, image.
 * Filter: cardtrader_id IN(...) or id IN(...) depending on index schema.
 */

import { config } from '@/lib/config';

export interface CardCatalogHit {
  id: string;
  name?: string;
  set_name?: string;
  game_slug?: string;
  image?: string | null;
  cardtrader_id?: number;
  /** Nomi localizzati: ordine en, de, es, fr, it, pt (per nome in lingua preferita) */
  keywords_localized?: string[];
  /** MTG: Rare, Mythic, Common, Uncommon */
  rarity?: string;
  /** MTG: numero collezionista (es. "028", "1910") */
  collector_number?: string;
}

/** Map blueprint_id (number) -> card data for display (name, set_name, image_url). */
export type BlueprintToCardMap = Record<number, CardCatalogHit>;

const MEILI_URL = (config.meilisearch.url || '').replace(/\/+$/, '');
const MEILI_KEY = config.meilisearch.apiKey || '';
const INDEX = config.meilisearch.indexName || 'cards';

/**
 * Fetch cards from Meilisearch by a list of blueprint_ids (or numeric ids).
 * Uses POST /indexes/cards/search with filter "cardtrader_id IN(id1, id2, ...)".
 * If your index uses a different filterable field (e.g. "id"), set filterField.
 * Returns a map blueprint_id -> hit for quick lookup.
 */
export async function fetchCardsByBlueprintIds(
  blueprintIds: number[],
  filterField: string = 'cardtrader_id'
): Promise<BlueprintToCardMap> {
  if (!MEILI_URL || blueprintIds.length === 0) return {};

  const uniq = [...new Set(blueprintIds)].filter((n) => Number.isInteger(n));
  if (uniq.length === 0) return {};

  // Meilisearch IN richiede parentesi quadre: cardtrader_id IN [1, 2, 3]
  const filter = `${filterField} IN [${uniq.join(', ')}]`;
  const url = `${MEILI_URL}/indexes/${INDEX}/search`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (MEILI_KEY) headers.Authorization = `Bearer ${MEILI_KEY}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ filter, limit: uniq.length }),
    });
    if (!res.ok) return {};
    const data = (await res.json()) as { hits?: CardCatalogHit[] };
    const hits = Array.isArray(data.hits) ? data.hits : [];
    const map: BlueprintToCardMap = {};
    for (const hit of hits) {
      // Prefer cardtrader_id (CardTrader blueprint_id) per il mapping inventario
      const blueprintId =
        hit.cardtrader_id ??
        (typeof hit.id === 'number' ? hit.id : null) ??
        (typeof hit.id === 'string' && /^\d+$/.test(hit.id) ? Number(hit.id) : null);
      if (blueprintId != null) map[blueprintId] = hit;
    }
    return map;
  } catch {
    return {};
  }
}
