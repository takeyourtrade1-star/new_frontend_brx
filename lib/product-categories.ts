/**
 * Configurazione voci menu Prodotti: slug URL, titolo pagina, label categoria, eventuale category_id Meilisearch.
 * category_id si usa per filtrare sealed/boosters ecc. (se l'indice lo espone).
 */
export const PRODUCT_CATEGORIES = [
  { slug: 'singles', title: 'Singles', categoryLabel: 'Singles', categoryId: undefined },
  { slug: 'boosters', title: 'Boosters', categoryLabel: 'Boosters', categoryId: undefined },
  { slug: 'booster-boxes', title: 'Booster boxes', categoryLabel: 'Booster boxes', categoryId: undefined },
  { slug: 'set-lotti-collezioni', title: 'Set, lotti e collezioni', categoryLabel: 'Set, lotti e collezioni', categoryId: undefined },
  { slug: 'sigillati', title: 'Prodotti sigillati', categoryLabel: 'Prodotti sigillati', categoryId: undefined },
  { slug: 'accessori', title: 'Accessori', categoryLabel: 'Accessori', categoryId: undefined },
  { slug: 'boutique', title: 'Ebartex Boutique', categoryLabel: 'Ebartex Boutique', categoryId: undefined },
] as const;

export type ProductCategorySlug = (typeof PRODUCT_CATEGORIES)[number]['slug'];

/** Set degli slug categoria per distinguere /products/singles da /products/mtg_123 */
export const CATEGORY_SLUGS: Set<string> = new Set(PRODUCT_CATEGORIES.map((c) => c.slug));
