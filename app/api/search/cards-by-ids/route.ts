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
        { error: `Meilisearch error: ${res.status}` },
        { status: publicStatusForMeiliStatus(res.status) }
      );
    }

    const data = (await res.json()) as { hits?: CardCatalogHit[] };
    const hits = Array.isArray(data.hits) ? data.hits : [];

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
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'Ricerca catalogo non disponibile', detail: message },
      { status: 502 }
    );
  }
}
