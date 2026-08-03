/** Shared product types and pure presentation helpers (safe for Client Components). */

import { normalizeCatalogProductId } from '@/lib/security/catalog-public-data';

/** Documento carta/prodotto come restituito da Meilisearch (allineato all'indexer search_engine). */
export interface CardDocument {
  id: string;
  name: string;
  set_name: string;
  game_slug: string;
  image?: string | null;
  category_name?: string;
  /** Blueprint ID (per fetch listings/venditori). */
  cardtrader_id?: number;
  /** MTG: Rare, Mythic, Common, Uncommon, etc. */
  rarity?: string;
  /** MTG: numero collezionista (es. "028", "1910"). */
  collector_number?: string;
  /** MTG: codici lingua in cui la carta è disponibile (es. ["en","it","fr"]). */
  available_languages?: string[];
  market_price?: number;
  foil_price?: number;
  keywords_localized?: string[];
  /** URI icona del set (SVG/PNG, da S3/CDN). */
  set_icon_uri?: string | null;
  /** Codice breve del set (es. "BLB", "ONE"). */
  set_code?: string | null;
  /** MTG: raggruppa tutte le stampe della stessa carta (filterable in Meilisearch). */
  oracle_id?: string | null;
  /** OP/PK: raggruppa stampe della stessa carta (filterable in Meilisearch). */
  card_id?: string | number | null;
  category_id?: number;
}

export interface ProductDetailData {
  id: string;
  name: string;
  set_name: string;
  game_slug: string;
  category_name?: string;
  imageUrl: string | null;
  keywords_localized?: string[];
  /** MTG: per pagina dettaglio */
  collector_number?: string;
  rarity?: string;
  available_languages?: string[];
}

const GAME_LABELS: Record<string, string> = {
  mtg: 'MAGIC: THE GATHERING',
  op: 'ONE PIECE',
  pk: 'POKÉMON',
  pokemon: 'POKÉMON',
};

export function getGameLabel(gameSlug: string): string {
  return GAME_LABELS[gameSlug] ?? gameSlug.toUpperCase();
}

/** Restituisce true se slug è un id documento Meilisearch (mtg_123, op_456, pk_789, sealed_10). */
export function isIndexProductId(slug: string): boolean {
  return normalizeCatalogProductId(slug) !== null;
}

/**
 * Costruisce breadcrumb per la pagina dettaglio da product (dati Meilisearch).
 */
export function buildBreadcrumbs(product: ProductDetailData): { label: string; href?: string }[] {
  const gameLabel = getGameLabel(product.game_slug);
  const base = [
    { label: gameLabel, href: '/products' },
    { label: product.category_name ?? 'SINGLES', href: '/search' },
    { label: product.set_name || '–', href: '#' },
    { label: product.name || '–', href: undefined },
  ];
  return base;
}

/** Breadcrumb per la pagina dettaglio a partire da CardDocument (Meilisearch). */
export function buildBreadcrumbsFromCard(card: CardDocument): { label: string; href?: string }[] {
  const gameLabel = getGameLabel(card.game_slug);
  return [
    { label: gameLabel, href: '/products' },
    { label: card.category_name ?? 'SINGLES', href: '/search' },
    { label: card.set_name || '–', href: '#' },
    { label: card.name || '–', href: undefined },
  ];
}
