import { generateSlug } from '@/lib/mock-cards';
import {
  FRONTEND_TO_GAME_SLUG,
  normalizeCategoryKey,
  type CategoryKey,
} from '@/lib/search/category-mapping';
import { getProductDetailHref, withSellFlow } from '@/lib/sell-flow/sell-flow';
import type { GameSlug } from '@/lib/contexts/GameContext';
import type { CardSearchHit } from '@/lib/search/global-search-types';

/** Slug frontend (GameContext) → slug tabella games / Meilisearch (DB: mtg, pokemon, one-piece). */
export const FRONTEND_TO_DB_SLUG: Record<string, string> = {
  mtg: 'mtg',
  pokemon: 'pokemon',
  op: 'one-piece',
};

/** Costruisce URL pagina risultati; game in query = slug DB (per /api/search e Meilisearch). */
export function buildSearchUrl(q: string, game?: GameSlug | null, categoryKey?: CategoryKey | null): string {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (game) {
    const dbSlug = FRONTEND_TO_GAME_SLUG[game] ?? game;
    params.set('game', dbSlug);
  }
  const normalizedCategory = normalizeCategoryKey(categoryKey);
  if (normalizedCategory && normalizedCategory !== 'all') {
    params.set('category_key', normalizedCategory);
  }
  return `/search?${params.toString()}`;
}

export function firstNonEmptyString(
  ...values: Array<string | null | undefined>
): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return null;
}

/**
 * Slug/ID per la navigazione a /products/[slug].
 * Se l'id è già un id documento Meilisearch (mtg_123, op_456, pk_789, sealed_10) lo usa così com'è,
 * così la pagina dettaglio carica i dati da Meilisearch.
 */
export function getCardSlugForUrl(hit: CardSearchHit): string {
  const raw = (hit.id ?? hit.card_print_id ?? hit.objectID ?? '').toString().trim();
  if (/^(mtg|pk|op|sealed)_\d+$/.test(raw)) {
    return raw;
  }
  return generateSlug(hit.name ?? '');
}

export function productDetailPath(slug: string, sellFlowActive: boolean): string {
  return sellFlowActive ? getProductDetailHref(slug, { sellFlow: true }) : `/products/${slug}`;
}

export function searchResultsPath(
  q: string,
  game?: GameSlug | null,
  categoryKey?: CategoryKey | null,
  sellFlowActive = false,
): string {
  const url = buildSearchUrl(q, game, categoryKey);
  return sellFlowActive ? withSellFlow(url) : url;
}
