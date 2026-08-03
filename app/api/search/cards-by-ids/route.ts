/**
 * POST /api/search/cards-by-ids
 * Body: { ids: number[], filterField?: 'cardtrader_id' | 'id' }
 *
 * Risolve un batch di blueprint/card id in dati di catalogo (nome, set, immagine).
 * Sostituisce il fetch diretto browser -> Meilisearch di lib/meilisearch-cards-by-ids.ts:
 * tutta la richiesta (incluso l'Authorization Bearer) resta lato server, cosi nessuna
 * chiave Meilisearch raggiunge mai il bundle/le DevTools del browser.
 *
 * Dati di catalogo pubblici (non legati a un utente): cache breve concessa.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';
import {
  readTextBodyWithLimit,
  RequestBodyTimeoutError,
} from '@/app/api/_lib/request-body';
import { noStoreHeaders } from '@/app/api/_lib/proxy-response';
import { readJsonResponseWithLimit } from '@/app/api/_lib/bounded-json-response';
import {
  enforceJsonContentType,
  enforceSameOrigin,
} from '@/app/api/_lib/request-security';
import { sanitizeCatalogImageFields } from '@/lib/security/catalog-public-data';
import { getMeilisearchServerConfig } from '@/lib/meilisearch-server-env';
import {
  MAX_IDS_BATCH,
  MeiliFetchError,
  fetchMeiliWithTimeout,
  normalizeIdFilterField,
  normalizeIdList,
  publicStatusForMeiliStatus,
} from '@/lib/search/search-request-utils';

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
  keywords_localized?: string[];
  rarity?: string;
  collector_number?: string;
}

const CATALOG_ATTRIBUTES_TO_RETRIEVE = [
  'id',
  'name',
  'set_name',
  'set_code',
  'set_icon_uri',
  'icon_svg_uri',
  'game_slug',
  'image',
  'cardtrader_id',
  'keywords_localized',
  'rarity',
  'collector_number',
] as const;

interface RequestBody {
  ids?: unknown;
  filterField?: unknown;
}

function isExactRequestBody(value: unknown): value is RequestBody {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const body = value as Record<string, unknown>;
  if (!Object.keys(body).every((key) => key === 'ids' || key === 'filterField')) return false;
  if (!Array.isArray(body.ids) || body.ids.length > MAX_IDS_BATCH) return false;
  if (!body.ids.every(
    (id) => typeof id === 'number' && Number.isSafeInteger(id) && id > 0,
  )) return false;
  return body.filterField === undefined
    || body.filterField === 'cardtrader_id'
    || body.filterField === 'id';
}

export async function POST(request: NextRequest) {
  const requestViolation =
    enforceSameOrigin(request) ?? enforceJsonContentType(request);
  if (requestViolation) return requestViolation;

  const rateLimit = await checkRateLimit(request, {
    scope: 'search:cards-by-ids',
    limit: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimitExceededResponse(rateLimit);

  const { url: meiliUrl, apiKey: meiliKey, index } = getMeilisearchServerConfig();
  if (!meiliUrl || !meiliKey) {
    return NextResponse.json(
      { error: 'Ricerca catalogo non disponibile' },
      { status: 503 }
    );
  }

  let body: RequestBody;
  try {
    const bodyResult = await readTextBodyWithLimit(request, 64 * 1024);
    if (bodyResult.tooLarge) {
      return NextResponse.json({ error: 'Payload troppo grande' }, { status: 413 });
    }
    const parsed = JSON.parse(bodyResult.body || '{}') as unknown;
    if (!isExactRequestBody(parsed)) {
      return NextResponse.json(
        { error: 'Payload non valido' },
        { status: 400, headers: noStoreHeaders() },
      );
    }
    body = parsed;
  } catch (error) {
    if (error instanceof RequestBodyTimeoutError) {
      return NextResponse.json(
        { error: 'Timeout lettura richiesta' },
        { status: 408, headers: noStoreHeaders() },
      );
    }
    return NextResponse.json(
      { error: 'JSON non valido' },
      { status: 400, headers: noStoreHeaders() },
    );
  }

  const ids = normalizeIdList(body?.ids);
  if (ids.length === 0) {
    return NextResponse.json(
      { hits: [], note: ids.length === 0 && Array.isArray(body?.ids) && (body.ids as unknown[]).length > 0
          ? `Nessun id valido (max ${MAX_IDS_BATCH} interi positivi per richiesta)`
          : undefined },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const filterField = normalizeIdFilterField(body?.filterField);
  // Meilisearch IN richiede parentesi quadre: cardtrader_id IN [1, 2, 3]
  const filter = `${filterField} IN [${ids.join(', ')}]`;

  const searchUrl = `${meiliUrl}/indexes/${index}/search`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (meiliKey) headers.Authorization = `Bearer ${meiliKey}`;

  try {
    const res = await fetchMeiliWithTimeout(searchUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filter,
        limit: ids.length,
        attributesToRetrieve: [...CATALOG_ATTRIBUTES_TO_RETRIEVE],
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Ricerca catalogo non disponibile' },
        { status: publicStatusForMeiliStatus(res.status) }
      );
    }

    const data = (await readJsonResponseWithLimit(res, 2 * 1_024 * 1_024)) as {
      hits?: CardCatalogHit[];
    };
    const hits = Array.isArray(data.hits)
      ? data.hits.map((hit) => sanitizeCatalogImageFields(hit))
      : [];

    return NextResponse.json(
      { hits },
      {
        headers: {
          // Dati di catalogo (non personali): cache breve concessa.
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=120',
        },
      }
    );
  } catch (err) {
    if (err instanceof MeiliFetchError) {
      return NextResponse.json({ error: 'Ricerca catalogo non disponibile' }, { status: err.status });
    }
    return NextResponse.json(
      { error: 'Ricerca catalogo non disponibile' },
      { status: 502 }
    );
  }
}
