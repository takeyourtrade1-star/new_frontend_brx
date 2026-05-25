import {
  getCategoryIds,
  getCategoryIdsAcrossGames,
  normalizeCategoryKey,
  type CategoryKey,
  type GameSlug,
} from '@/lib/search/category-mapping';

/**
 * Configurazione voci menu Prodotti: slug URL, titolo pagina, label categoria, eventuale category_id Meilisearch.
 * Gli ID effettivi per Meilisearch si risolvono con getCategoryIdsForProductSlug (mapping per gioco).
 */
export const PRODUCT_CATEGORIES = [
  { slug: 'singles', title: 'Singles', subtitle: 'Esplora la collezione completa di carte singole Magic: The Gathering', categoryLabel: 'Singles', categoryId: undefined },
  { slug: 'boosters', title: 'Boosters', subtitle: 'Scopri tutti i booster pack disponibili per le tue espansioni preferite', categoryLabel: 'Boosters', categoryId: undefined },
  { slug: 'booster-boxes', title: 'Booster Boxes', subtitle: 'Box completi di buste per espandere la tua collezione al massimo', categoryLabel: 'Booster boxes', categoryId: undefined },
  { slug: 'set-lotti-collezioni', title: 'Set, lotti e collezioni', subtitle: 'Trova set completi, lotti e collezioni curate', categoryLabel: 'Set, lotti e collezioni', categoryId: undefined },
  { slug: 'sigillati', title: 'Prodotti sigillati', subtitle: 'Prodotti sigillati originali, pronti per essere aperti', categoryLabel: 'Prodotti sigillati', categoryId: undefined },
  { slug: 'accessori', title: 'Accessori', subtitle: 'Proteggi e organizza le tue carte con i migliori accessori', categoryLabel: 'Accessori', categoryId: undefined },
  { slug: 'boutique', title: 'Ebartex Boutique', subtitle: 'Prodotti esclusivi e personalizzati Ebartex', categoryLabel: 'Ebartex Boutique', categoryId: undefined },
] as const;

export type ProductCategorySlug = (typeof PRODUCT_CATEGORIES)[number]['slug'];

/** Set degli slug categoria per distinguere /products/singles da /products/mtg_123 */
export const CATEGORY_SLUGS: Set<string> = new Set(PRODUCT_CATEGORIES.map((c) => c.slug));

/** Macro-categorie Meilisearch per la pagina Prodotti sigillati (mazzi, tin, ecc.). */
const SIGILLATI_CATEGORY_KEYS: CategoryKey[] = ['starter_precon', 'tins'];

/**
 * Risolve gli ID categoria Meilisearch per uno slug pagina prodotti (/products/singles, ecc.).
 */
export function getCategoryIdsForProductSlug(
  game: GameSlug | null | undefined,
  slug: string
): number[] {
  if (slug === 'sigillati') {
    const unique = new Set<number>();
    if (game) {
      for (const key of SIGILLATI_CATEGORY_KEYS) {
        for (const id of getCategoryIds(game, key)) unique.add(id);
      }
    } else {
      for (const key of SIGILLATI_CATEGORY_KEYS) {
        for (const id of getCategoryIdsAcrossGames(key)) unique.add(id);
      }
    }
    return Array.from(unique);
  }

  const key = normalizeCategoryKey(slug);
  if (!key || key === 'all' || key === 'sets') return [];
  if (game) return getCategoryIds(game, key);
  return getCategoryIdsAcrossGames(key);
}
