/**
 * Fetch card/catalog data by blueprint_id (or numeric id), enriching inventory
 * items with name, set, image.
 *
 * SICUREZZA: questa funzione non parla più direttamente con Meilisearch dal browser
 * (niente più `Authorization: Bearer <NEXT_PUBLIC_MEILISEARCH_API_KEY>` nel bundle).
 * Inoltra la richiesta a /api/search/cards-by-ids, una route handler server-side che
 * detiene le credenziali Meilisearch (variabili server-only) e applica
 * validazione/limiti prima di interrogare l'istanza.
 *
 * La firma esportata resta invariata: i call site esistenti (OggettiContent,
 * UserProfileCollectionPanel, TradeProposalPage, AuctionCreateCardPicker,
 * ProductDetailView) non necessitano modifiche.
 */

export interface CardCatalogHit {
  id: string;
  name?: string;
  set_name?: string;
  set_code?: string | null;
  set_icon_uri?: string | null;
  icon_svg_uri?: string | null;
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

/**
 * Fetch cards by a list of blueprint_ids (or numeric ids) via /api/search/cards-by-ids
 * (server-side Meilisearch lookup, "filterField IN [...]"). Returns a map
 * blueprint_id -> hit for quick lookup. Never throws — returns {} on any error,
 * matching the previous client-side behaviour so call sites don't need changes.
 */
export async function fetchCardsByBlueprintIds(
  blueprintIds: number[],
  filterField: string = 'cardtrader_id'
): Promise<BlueprintToCardMap> {
  const uniq = [...new Set(blueprintIds)].filter((n) => Number.isInteger(n));
  if (uniq.length === 0) return {};

  try {
    const res = await fetch('/api/search/cards-by-ids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: uniq, filterField }),
    });
    if (!res.ok) return {};

    const data = (await res.json()) as { hits?: CardCatalogHit[] };
    const hits = Array.isArray(data.hits) ? data.hits : [];
    const map: BlueprintToCardMap = {};
    for (const hit of hits) {
      // Prefer blueprint_id per il mapping inventario
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
