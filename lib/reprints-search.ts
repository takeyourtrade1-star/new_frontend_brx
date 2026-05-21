/**
 * Ricerca ristampe (stampe della stessa carta) su Meilisearch.
 * Usato da /api/reprints (server) e testabile in isolamento.
 */

import type { CardDocument } from '@/lib/product-detail';
import { getCategoryIds, normalizeGameSlug } from '@/lib/search/category-mapping';

export type ReprintSearchHit = {
  id: string;
  name?: string;
  set_name?: string;
  rarity?: string;
  image?: string | null;
  image_uri_small?: string | null;
  image_uri_normal?: string | null;
  image_path?: string | null;
  set_icon_uri?: string | null;
  icon_svg_uri?: string | null;
  set_code?: string | null;
  game_slug?: string | null;
  oracle_id?: string | null;
  card_id?: string | number | null;
};

export const REPRINTS_PAGE_SIZE = 100;
export const REPRINTS_MAX_PAGES = 20;

export const REPRINT_ATTRIBUTES_TO_RETRIEVE = [
  'id',
  'name',
  'set_name',
  'rarity',
  'oracle_id',
  'card_id',
  'image',
  'image_uri_small',
  'image_uri_normal',
  'image_path',
  'set_icon_uri',
  'icon_svg_uri',
  'set_code',
  'game_slug',
] as const;

export function escapeMeiliFilterValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** game_slug sul documento Meilisearch (= games.slug in DB). Non mappare slug UI. */
export function resolveReprintGameSlug(rawGameSlug: string): string {
  return rawGameSlug.trim();
}

function coerceCategoryId(value: unknown): number | undefined {
  if (value == null) return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function buildReprintCategoryFilter(gameSlug: string, categoryId?: number): string | null {
  if (categoryId != null && Number.isFinite(categoryId)) {
    return `category_id = ${categoryId}`;
  }
  const game = normalizeGameSlug(gameSlug);
  if (!game) return null;
  const ids = getCategoryIds(game, 'singles');
  if (ids.length === 0) return null;
  if (ids.length === 1) return `category_id = ${ids[0]}`;
  return `category_id IN [${ids.join(', ')}]`;
}

export function buildReprintFilterParts(
  card: Pick<CardDocument, 'game_slug' | 'category_id'>,
  options?: { includeCategory?: boolean }
): string[] {
  const parts = [
    `game_slug = "${escapeMeiliFilterValue(resolveReprintGameSlug(card.game_slug))}"`,
  ];
  if (options?.includeCategory !== false) {
    const categoryFilter = buildReprintCategoryFilter(
      card.game_slug,
      coerceCategoryId(card.category_id)
    );
    if (categoryFilter) parts.push(categoryFilter);
  }
  return parts;
}

/** Semplifica filtri se Meilisearch risponde 400 (attributo non filterable, ecc.). */
export function buildFilterFallbackChain(filters: string[]): string[] {
  const full = filters.filter(Boolean).join(' AND ');
  const withoutEntity = filters
    .filter((f) => !f.startsWith('oracle_id') && !f.startsWith('card_id'))
    .join(' AND ');
  const withoutCategory = filters.filter((f) => !f.startsWith('category_id')).join(' AND ');
  const gameOnly = filters.find((f) => f.startsWith('game_slug')) ?? '';
  const chain: string[] = [];
  for (const candidate of [full, withoutEntity, withoutCategory, gameOnly]) {
    if (candidate && !chain.includes(candidate)) chain.push(candidate);
  }
  return chain;
}

export type ReprintSearchStrategy = {
  q?: string;
  filters: string[];
  matchNameExactly?: boolean;
  matchOracleId?: string;
  matchCardId?: string;
  /** Filtro oracle_id/card_id applicato lato server (non ripetere in post-filter se campo assente). */
  serverEntityFilter?: boolean;
};

export function buildReprintSearchStrategies(
  card: Pick<CardDocument, 'name' | 'game_slug' | 'category_id' | 'oracle_id' | 'card_id'>
): ReprintSearchStrategy[] {
  const strategies: ReprintSearchStrategy[] = [];
  const baseParts = buildReprintFilterParts(card);
  const name = card.name.trim();
  const oracleId = card.oracle_id?.trim();
  const cardId = card.card_id != null ? String(card.card_id).trim() : '';

  if (oracleId) {
    strategies.push({
      filters: [...baseParts, `oracle_id = "${escapeMeiliFilterValue(oracleId)}"`],
      matchOracleId: oracleId,
      serverEntityFilter: true,
    });
  }

  if (cardId) {
    strategies.push({
      filters: [...baseParts, `card_id = "${escapeMeiliFilterValue(cardId)}"`],
      matchCardId: cardId,
      serverEntityFilter: true,
    });
  }

  if (name) {
    strategies.push({
      q: name,
      filters: baseParts,
      matchNameExactly: true,
      matchOracleId: oracleId || undefined,
      matchCardId: !oracleId && cardId ? cardId : undefined,
    });
  }

  if (name) {
    strategies.push({
      q: name,
      filters: buildReprintFilterParts(card, { includeCategory: false }),
      matchNameExactly: true,
      matchOracleId: oracleId || undefined,
    });
  }

  return strategies;
}

export function filterReprintHits(
  hits: ReprintSearchHit[],
  strategy: ReprintSearchStrategy,
  normalizedCardName: string
): ReprintSearchHit[] {
  return hits.filter((hit) => {
    if (strategy.matchNameExactly) {
      if ((hit.name ?? '').trim().toLowerCase() !== normalizedCardName) return false;
    }
    if (strategy.matchOracleId && !strategy.serverEntityFilter) {
      const hitOracle = (hit.oracle_id ?? '').trim();
      if (hitOracle && hitOracle !== strategy.matchOracleId) return false;
    }
    if (strategy.matchCardId && !strategy.serverEntityFilter) {
      const hitCard = String(hit.card_id ?? '').trim();
      if (hitCard && hitCard !== strategy.matchCardId) return false;
    }
    return true;
  });
}

export type MeilisearchSearchFn = (body: Record<string, unknown>) => Promise<{
  ok: boolean;
  status: number;
  hits: ReprintSearchHit[];
  estimatedTotalHits?: number;
}>;

/** Esegue le strategie fino al primo risultato non vuoto. */
export async function fetchReprintsForCard(
  card: Pick<
    CardDocument,
    'id' | 'name' | 'game_slug' | 'category_id' | 'oracle_id' | 'card_id'
  >,
  search: MeilisearchSearchFn
): Promise<ReprintSearchHit[]> {
  if (!card.id?.trim() || !card.name?.trim() || !card.game_slug?.trim()) {
    return [];
  }

  const strategies = buildReprintSearchStrategies(card);
  const normalizedCardName = card.name.trim().toLowerCase();

  for (const strategy of strategies) {
    for (const filter of buildFilterFallbackChain(strategy.filters)) {
      const strategyHits: ReprintSearchHit[] = [];
      let offset = 0;
      let useSort = true;

      for (let page = 0; page < REPRINTS_MAX_PAGES; page++) {
        const body: Record<string, unknown> = {
          limit: REPRINTS_PAGE_SIZE,
          offset,
          filter,
          attributesToRetrieve: [...REPRINT_ATTRIBUTES_TO_RETRIEVE],
        };
        if (strategy.q) body.q = strategy.q;
        if (useSort) body.sort = ['set_name:asc'];

        let result = await search(body);

        if (result.status === 400 && useSort) {
          useSort = false;
          offset = 0;
          strategyHits.length = 0;
          page = -1;
          result = await search(body);
        }

        if (!result.ok) break;

        const rawPageHits = Array.isArray(result.hits) ? result.hits : [];
        strategyHits.push(...filterReprintHits(rawPageHits, strategy, normalizedCardName));

        if (rawPageHits.length < REPRINTS_PAGE_SIZE) break;

        offset += REPRINTS_PAGE_SIZE;
        const estimatedTotal =
          typeof result.estimatedTotalHits === 'number' ? result.estimatedTotalHits : null;
        if (estimatedTotal != null && offset >= estimatedTotal) break;
      }

      if (strategyHits.length > 0) {
        return strategyHits.filter((hit) => hit.id && hit.id !== card.id);
      }
    }
  }

  return [];
}
