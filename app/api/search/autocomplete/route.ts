/**
 * POST /api/search/autocomplete
 * Body: { requests: [{ indexName?, params?: { query?, filters?, hitsPerPage?, page? } }] }
 *
 * Proxy server-side per la ricerca "instant" della GlobalSearchBar (header).
 * Riceve le richieste nel formato multi-query stile Algolia che react-instantsearch
 * invia al searchClient, le valida/normalizza, interroga Meilisearch con le
 * credenziali server-only e restituisce una risposta nello stesso formato
 * (`{ results: [...] }`) cosi il client può continuare a usare InstantSearch/useHits
 * senza mai vedere host o API key di Meilisearch.
 *
 * Sicurezza:
 * - La filter string arriva dal browser (costruita da <Configure filter=.../>); viene
 *   accettata SOLO se rispetta rigorosamente l'allowlist (game_slug noto, category_id
 *   numerico/IN[...]). Qualunque cosa non corrisponda viene scartata silenziosamente
 *   (nessun filtro), non inoltrata mai cosi com'è a Meilisearch.
 * - hitsPerPage/page/query hanno limiti duri.
 * - Nessun dato personale: cache breve concessa.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMeilisearchServerConfig } from '@/lib/meilisearch-server-env';
import {
  ALLOWED_GAME_SLUGS,
  MAX_AUTOCOMPLETE_REQUESTS,
  MeiliFetchError,
  fetchMeiliWithTimeout,
  normalizeQuery,
  publicStatusForMeiliStatus,
} from '@/lib/search/search-request-utils';

const AUTOCOMPLETE_ATTRIBUTES_TO_RETRIEVE = [
  'id',
  'name',
  'set_name',
  'set_code',
  'set_icon_uri',
  'icon_svg_uri',
  'game_slug',
  'category_id',
  'category_name',
  'image',
  'image_path',
  'image_uri_small',
  'image_uri_normal',
  'collector_number',
  'rarity',
  'type',
  'keywords_localized',
] as const;

const MAX_HITS_PER_PAGE = 20;
const MAX_PAGE = 50;

const GAME_SLUG_CLAUSE = /^game_slug = "([a-z0-9_-]{1,40})"$/;
const CATEGORY_EQ_CLAUSE = /^category_id = (-?\d{1,7})$/;
const CATEGORY_IN_CLAUSE = /^category_id IN \[(\d{1,7}(?:, \d{1,7}){0,49})\]$/;

/**
 * Valida una filter string contro un'allowlist rigorosa di clausole note.
 * Restituisce la stringa originale se ogni clausola (separata da " AND ") è
 * riconosciuta e sicura, altrimenti undefined (nessun filtro applicato — fail safe).
 * Non costruiamo mai una nuova filter string da pezzi non fidati: o l'input intero
 * corrisponde a un pattern noto, o viene scartato.
 */
function sanitizeAutocompleteFilter(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const filter = raw.trim();
  if (!filter || filter.length > 500) return undefined;

  const clauses = filter.split(' AND ');
  if (clauses.length === 0 || clauses.length > 6) return undefined;

  for (const clause of clauses) {
    const gameMatch = clause.match(GAME_SLUG_CLAUSE);
    if (gameMatch) {
      if (!ALLOWED_GAME_SLUGS.has(gameMatch[1])) return undefined;
      continue;
    }

    const eqMatch = clause.match(CATEGORY_EQ_CLAUSE);
    if (eqMatch) {
      // -999 è il valore sentinella usato dalla UI per bloccare i risultati in modalità "sets".
      const value = Number(eqMatch[1]);
      if (value === -999 || (value > 0 && value < 1_000_000)) continue;
      return undefined;
    }

    const inMatch = clause.match(CATEGORY_IN_CLAUSE);
    if (inMatch) {
      const ids = inMatch[1].split(', ').map(Number);
      if (ids.every((id) => id > 0 && id < 1_000_000)) continue;
      return undefined;
    }

    // Clausola non riconosciuta: scarta l'intero filtro per sicurezza.
    return undefined;
  }

  return filter;
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const num = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, Math.trunc(num)));
}

interface AutocompleteRequest {
  indexName?: unknown;
  params?: {
    query?: unknown;
    filters?: unknown;
    hitsPerPage?: unknown;
    page?: unknown;
  };
}

interface RequestBody {
  requests?: unknown;
}

export async function POST(request: NextRequest) {
  const { url: meiliUrl, apiKey: meiliKey, index } = getMeilisearchServerConfig();
  if (!meiliUrl) {
    return NextResponse.json(
      { error: 'Meilisearch non configurato (MEILISEARCH_URL)' },
      { status: 503 }
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: 'JSON non valido' }, { status: 400 });
  }

  const rawRequests = Array.isArray(body?.requests) ? (body.requests as AutocompleteRequest[]) : [];
  if (rawRequests.length === 0) {
    return NextResponse.json({ error: 'Nessuna richiesta fornita' }, { status: 400 });
  }
  if (rawRequests.length > MAX_AUTOCOMPLETE_REQUESTS) {
    return NextResponse.json(
      { error: `Troppe richieste in un'unica chiamata (max ${MAX_AUTOCOMPLETE_REQUESTS})` },
      { status: 400 }
    );
  }

  const searchUrl = `${meiliUrl}/indexes/${index}/search`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (meiliKey) headers.Authorization = `Bearer ${meiliKey}`;

  try {
    const results = await Promise.all(
      rawRequests.map(async (req) => {
        const query = normalizeQuery(typeof req?.params?.query === 'string' ? req.params.query : '');
        const filter = sanitizeAutocompleteFilter(req?.params?.filters);
        const hitsPerPage = clamp(req?.params?.hitsPerPage, 1, MAX_HITS_PER_PAGE, 8);
        const page = clamp(req?.params?.page, 0, MAX_PAGE, 0);

        const meiliBody: Record<string, unknown> = {
          q: query || undefined,
          limit: hitsPerPage,
          offset: page * hitsPerPage,
          attributesToRetrieve: [...AUTOCOMPLETE_ATTRIBUTES_TO_RETRIEVE],
        };
        if (filter) meiliBody.filter = filter;

        const res = await fetchMeiliWithTimeout(searchUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(meiliBody),
        });

        if (!res.ok) {
          throw new MeiliFetchError(`Meilisearch error: ${res.status}`, publicStatusForMeiliStatus(res.status));
        }

        const data = (await res.json()) as {
          hits?: Record<string, unknown>[];
          estimatedTotalHits?: number;
          processingTimeMs?: number;
        };
        const hits = Array.isArray(data.hits) ? data.hits : [];
        const nbHits = typeof data.estimatedTotalHits === 'number' ? data.estimatedTotalHits : hits.length;
        const nbPages = hitsPerPage > 0 ? Math.ceil(nbHits / hitsPerPage) || 1 : 1;

        // Formato compatibile con react-instantsearch / instantsearch.js (stile Algolia multi-query).
        return {
          hits,
          nbHits,
          page,
          hitsPerPage,
          nbPages,
          exhaustiveNbHits: true,
          query,
          params: '',
          processingTimeMS: typeof data.processingTimeMs === 'number' ? data.processingTimeMs : 0,
          index: typeof req?.indexName === 'string' ? req.indexName : index,
          index_name: index,
        };
      })
    );

    return NextResponse.json(
      { results },
      {
        headers: {
          // Risultati di ricerca pubblici e non personali: cache breve.
          'Cache-Control': 'private, max-age=20, stale-while-revalidate=60',
        },
      }
    );
  } catch (err) {
    if (err instanceof MeiliFetchError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'Ricerca non disponibile', detail: message },
      { status: 502 }
    );
  }
}
