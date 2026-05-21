/**
 * Ricerca ristampe (stampe della stessa carta) su Meilisearch.
 * Single source of truth: usato da /api/reprints (server) e testabile in isolamento.
 */

import type { CardDocument } from '@/lib/product-detail';

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

export type ReprintsApiResponse = {
  card_id: string;
  oracle_id: string | null;
  card_entity_id: string | number | null;
  count: number;
  hits: ReprintSearchHit[];
};

export const REPRINTS_PAGE_SIZE = 100;
export const REPRINTS_MAX_PAGES = 20;
/** Limite richieste Meilisearch per singola GET /api/reprints. */
export const REPRINTS_MAX_MEILI_CALLS = 24;

/** category_id sulle singole nell'indice (indexer: sempre 1 per mtg/op/pk). */
const REPRINT_INDEX_SINGLES_CATEGORY_ID = 1;

/** Pattern id documento Meilisearch (allineato a isIndexProductId). */
export const REPRINT_CARD_ID_PATTERN = /^(mtg_|op_|pk_)\d+$/;

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

export function isValidReprintCardId(cardId: string): boolean {
  return REPRINT_CARD_ID_PATTERN.test(cardId.trim());
}

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
  const slug = resolveReprintGameSlug(gameSlug).toLowerCase();
  if (slug === 'mtg' || slug === 'op' || slug === 'pk') {
    return `category_id = ${REPRINT_INDEX_SINGLES_CATEGORY_ID}`;
  }
  return null;
}

export function shouldFetchReprints(
  card: Pick<CardDocument, 'id' | 'name' | 'game_slug'> | null | undefined
): boolean {
  if (!card?.id?.trim() || !card.name?.trim() || !card.game_slug?.trim()) return false;
  if (card.id.startsWith('sealed_')) return false;
  return true;
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

/** Deduplica per id preservando l'ordine (set_name:asc dal server). */
export function dedupeReprintHits(hits: ReprintSearchHit[]): ReprintSearchHit[] {
  const seen = new Set<string>();
  const out: ReprintSearchHit[] = [];
  for (const hit of hits) {
    const id = hit.id?.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(hit);
  }
  return out;
}

export type MeilisearchSearchFn = (body: Record<string, unknown>) => Promise<{
  ok: boolean;
  status: number;
  hits: ReprintSearchHit[];
  estimatedTotalHits?: number;
}>;

function buildSearchBody(
  strategy: ReprintSearchStrategy,
  filter: string,
  offset: number,
  useSort: boolean
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    limit: REPRINTS_PAGE_SIZE,
    offset,
    filter,
    attributesToRetrieve: [...REPRINT_ATTRIBUTES_TO_RETRIEVE],
  };
  if (strategy.q) body.q = strategy.q;
  if (useSort) body.sort = ['set_name:asc'];
  return body;
}

export class ReprintsSearchBudgetError extends Error {
  constructor() {
    super('Reprints Meilisearch call budget exceeded');
    this.name = 'ReprintsSearchBudgetError';
  }
}

/** Esegue le strategie fino al primo risultato non vuoto. */
export async function fetchReprintsForCard(
  card: Pick<
    CardDocument,
    'id' | 'name' | 'game_slug' | 'category_id' | 'oracle_id' | 'card_id'
  >,
  search: MeilisearchSearchFn
): Promise<ReprintSearchHit[]> {
  if (!shouldFetchReprints(card)) {
    return [];
  }

  const strategies = buildReprintSearchStrategies(card);
  const normalizedCardName = card.name.trim().toLowerCase();
  const excludeId = card.id.trim();
  let meiliCalls = 0;

  const guardedSearch: MeilisearchSearchFn = async (body) => {
    if (++meiliCalls > REPRINTS_MAX_MEILI_CALLS) {
      throw new ReprintsSearchBudgetError();
    }
    return search(body);
  };

  for (const strategy of strategies) {
    for (const filter of buildFilterFallbackChain(strategy.filters)) {
      const strategyHits: ReprintSearchHit[] = [];
      let offset = 0;
      let useSort = true;
      let filterRejected = false;

      for (let page = 0; page < REPRINTS_MAX_PAGES && !filterRejected; page++) {
        let result = await guardedSearch(buildSearchBody(strategy, filter, offset, useSort));

        if (result.status === 400 && useSort) {
          useSort = false;
          offset = 0;
          strategyHits.length = 0;
          page = -1;
          result = await guardedSearch(buildSearchBody(strategy, filter, offset, false));
        }

        if (result.status === 400) {
          filterRejected = true;
          break;
        }

        if (!result.ok) {
          if (result.status === 401 || result.status === 403) {
            throw new Error(`Meilisearch auth failed (${result.status})`);
          }
          break;
        }

        const rawPageHits = Array.isArray(result.hits) ? result.hits : [];
        strategyHits.push(...filterReprintHits(rawPageHits, strategy, normalizedCardName));

        if (rawPageHits.length < REPRINTS_PAGE_SIZE) break;

        offset += REPRINTS_PAGE_SIZE;
        const estimatedTotal =
          typeof result.estimatedTotalHits === 'number' ? result.estimatedTotalHits : null;
        if (estimatedTotal != null && offset >= estimatedTotal) break;
      }

      if (strategyHits.length > 0) {
        return dedupeReprintHits(
          strategyHits.filter((hit) => hit.id && hit.id !== excludeId)
        );
      }
    }
  }

  return [];
}
