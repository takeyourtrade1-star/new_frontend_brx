/**
 * API Route: ricerca su Meilisearch (server-side, niente CORS, niente chiavi nel browser).
 * GET /api/search?q=...&game=mtg&set=...&category_id=...&category_ids=1,2,3&page=1&limit=20&sort=...&exact_mode=true&show_similar=true
 *
 * Le credenziali Meilisearch arrivano da getMeilisearchServerConfig() (variabili
 * server-only: MEILISEARCH_URL / MEILISEARCH_SEARCH_API_KEY / MEILISEARCH_INDEX — mai
 * NEXT_PUBLIC_*, che finirebbero nel bundle browser).
 *
 * Tutti i parametri pubblici sono validati/normalizzati (lib/search/search-request-utils)
 * prima di costruire la filter string: lunghezza query, game allowlist, category_ids
 * limitati e numerici, sort allowlist, limit con hard cap. Risultati pubblici e non
 * personali → cache breve concessa.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';
import { readJsonResponseWithLimit } from '@/app/api/_lib/bounded-json-response';
import { getMeilisearchServerConfig } from '@/lib/meilisearch-server-env';
import { sanitizeCatalogImageFields } from '@/lib/security/catalog-public-data';
import {
  MeiliFetchError,
  escapeMeiliFilterValue,
  fetchMeiliWithTimeout,
  normalizeBoolean,
  normalizeCategoryId,
  normalizeCategoryIds,
  normalizeGameSlug,
  normalizeLimit,
  normalizePage,
  normalizeQuery,
  normalizeSetName,
  normalizeSort,
  publicStatusForMeiliStatus,
} from '@/lib/search/search-request-utils';

export interface SearchHit {
  id: string;
  name: string;
  set_name: string;
  set_code?: string | null;
  set_icon_uri?: string | null;
  game_slug: string;
  category_id: number;
  category_name?: string;
  image?: string | null;
  keywords_localized?: string[];
  /** MTG: Rare, Mythic, Common, Uncommon */
  rarity?: string;
  /** MTG: numero collezionista (es. "028", "1910") */
  collector_number?: string;
  /** Lingue disponibili per questa carta (es. ["en","it","fr"]). */
  available_languages?: string[];
  /** ID ufficiale CardTrader usato dai flussi inventario, vendita e scambio. */
  cardtrader_id?: number;
  market_price?: number;
  foil_price?: number;
}

export interface SearchApiResponse {
  hits: SearchHit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  /** Campi addizionali presenti solo quando exact_mode=true e la query non è vuota. */
  hasExactMatch?: boolean;
  hasSimilarMatch?: boolean;
  exactHits?: SearchHit[];
  similarHits?: SearchHit[];
}

const SEARCH_ATTRIBUTES_TO_RETRIEVE = [
  'id',
  'name',
  'set_name',
  'set_code',
  'set_icon_uri',
  'game_slug',
  'category_id',
  'category_name',
  'image',
  'keywords_localized',
  'rarity',
  'collector_number',
  'available_languages',
  'cardtrader_id',
  'market_price',
  'foil_price',
] as const;

function buildFilter(game: string, set: string, categoryId: number | null, categoryIds: number[]): string[] {
  const parts: string[] = [];
  if (game) parts.push(`game_slug = "${game}"`);
  if (set) parts.push(`set_name = "${escapeMeiliFilterValue(set)}"`);

  // Supporta sia category_ids (multiplo, già normalizzati) che category_id (singolo, legacy)
  if (categoryIds.length > 0) {
    if (categoryIds.length === 1) {
      parts.push(`category_id = ${categoryIds[0]}`);
    } else {
      parts.push(`category_id IN [${categoryIds.join(', ')}]`);
    }
  } else if (categoryId != null) {
    parts.push(`category_id = ${categoryId}`);
  }

  return parts;
}

function buildSort(sortBy: string): string[] {
  switch (sortBy) {
    case 'relevance':
      // Nessun sort: Meilisearch usa il ranking di rilevanza, come la barra principale.
      return [];
    case 'name_asc':
      return ['name:asc'];
    case 'name_desc':
      return ['name:desc'];
    case 'set_asc':
      return ['set_name:asc'];
    case 'set_desc':
      return ['set_name:desc'];
    case 'price_asc':
    case 'price_desc':
      // Meilisearch index potrebbe non avere sort su prezzo; usiamo name come fallback
      return ['name:asc'];
    default:
      return ['name:asc'];
  }
}

export async function GET(request: NextRequest) {
  const rateLimit = await checkRateLimit(request, {
    scope: 'search',
    limit: 120,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimitExceededResponse(rateLimit);

  const { url: MEILI_URL, apiKey: MEILI_KEY, index: INDEX } = getMeilisearchServerConfig();

  if (!MEILI_URL || !MEILI_KEY) {
    return NextResponse.json(
      { error: 'Ricerca non disponibile' },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = normalizeQuery(searchParams.get('q'));
  const game = normalizeGameSlug(searchParams.get('game'));
  const set = normalizeSetName(searchParams.get('set'));
  const categoryId = normalizeCategoryId(searchParams.get('category_id'));
  const categoryIds = normalizeCategoryIds(searchParams.get('category_ids'));
  const page = normalizePage(searchParams.get('page'));
  const limit = normalizeLimit(searchParams.get('limit'));
  const sortBy = normalizeSort(searchParams.get('sort'));
  const exactMode = normalizeBoolean(searchParams.get('exact_mode'));
  const showSimilar = normalizeBoolean(searchParams.get('show_similar'));

  const offset = (page - 1) * limit;
  const filterParts = buildFilter(game, set, categoryId, categoryIds);
  const filter = filterParts.length ? filterParts.join(' AND ') : undefined;
  const sort = buildSort(sortBy);

  const url = `${MEILI_URL}/indexes/${INDEX}/search`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${MEILI_KEY}`,
  };

  const doSearch = (includeSort: boolean) => {
    const body: Record<string, unknown> = {
      q: q || undefined,
      limit,
      offset,
      attributesToRetrieve: [...SEARCH_ATTRIBUTES_TO_RETRIEVE],
    };
    if (filter) body.filter = filter;
    if (includeSort && sort.length > 0) body.sort = sort;
    return fetchMeiliWithTimeout(url, { method: 'POST', headers, body: JSON.stringify(body) });
  };

  try {
    let res = await doSearch(true);
    // Se 400 (es. sortable non configurati), riprova senza sort (ordinamento per rilevanza)
    if (res.status === 400) {
      res = await doSearch(false);
    }
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Ricerca non disponibile' },
        { status: publicStatusForMeiliStatus(res.status) }
      );
    }

    const data = (await readJsonResponseWithLimit(res, 2 * 1_024 * 1_024)) as {
      hits: SearchHit[];
      estimatedTotalHits?: number;
      offset?: number;
      limit?: number;
    };

    const hits = Array.isArray(data.hits)
      ? data.hits.map((hit) => sanitizeCatalogImageFields(hit))
      : [];
    const total =
      typeof data.estimatedTotalHits === 'number' ? data.estimatedTotalHits : hits.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const qNorm = q.trim().toLowerCase();

    let exactHits: SearchHit[] | undefined;
    let similarHits: SearchHit[] | undefined;
    let hasExactMatch: boolean | undefined;
    let hasSimilarMatch: boolean | undefined;

    if (exactMode && qNorm) {
      exactHits = hits.filter((hit) => hit.name.trim().toLowerCase() === qNorm);
      similarHits = hits.filter((hit) => hit.name.trim().toLowerCase() !== qNorm);
      hasExactMatch = exactHits.length > 0;
      hasSimilarMatch = similarHits.length > 0;
    }

    const response: SearchApiResponse = {
      hits,
      total,
      page,
      limit,
      totalPages,
      ...(exactMode && {
        hasExactMatch,
        hasSimilarMatch,
        exactHits,
        similarHits: showSimilar ? similarHits : undefined,
      }),
    };

    return NextResponse.json(response, {
      headers: {
        // Catalogo pubblico, non personale: cache breve con revalidate.
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=120',
      },
    });
  } catch (err) {
    if (err instanceof MeiliFetchError) {
      return NextResponse.json({ error: 'Ricerca non disponibile' }, { status: err.status });
    }
    return NextResponse.json(
      { error: 'Ricerca non disponibile' },
      { status: 502 }
    );
  }
}
