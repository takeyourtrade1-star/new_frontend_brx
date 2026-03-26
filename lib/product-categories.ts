/**
 * Configurazione voci menu Prodotti: slug URL, titolo pagina, label categoria, eventuale category_id Meilisearch.
 * category_id si usa per filtrare sealed/boosters ecc. (se l'indice lo espone).
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
