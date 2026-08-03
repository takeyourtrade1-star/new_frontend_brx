/**
 * GET /api/reprints?card_id=mtg_40679
 * Ristampe della stessa carta (server-side Meilisearch, niente CORS / chiavi in browser).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCardDocumentById } from '@/lib/product-detail-server';
import { getMeilisearchServerConfig } from '@/lib/meilisearch-server-env';
import { readJsonResponseWithLimit } from '@/app/api/_lib/bounded-json-response';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';
import { appendQueryWithPolicy } from '@/app/api/_lib/query-policy';
import { sanitizeCatalogImageFields } from '@/lib/security/catalog-public-data';
import {
  fetchReprintsForCard,
  isValidReprintCardId,
  type ReprintSearchHit,
  type ReprintsApiResponse,
} from '@/lib/reprints-search';

export async function GET(request: NextRequest) {
  const rateLimit = await checkRateLimit(request, {
    scope: 'catalog:reprints',
    limit: 12,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimitExceededResponse(rateLimit);

  const safeQuery = new URL('https://catalog.invalid/');
  if (
    !appendQueryWithPolicy(safeQuery, request.nextUrl, {
      card_id: /^(?:mtg|op|pk)_[1-9]\d{0,15}$/,
    })
  ) {
    return NextResponse.json({ error: 'Query non valida' }, { status: 400 });
  }
  const { url: meiliUrl, apiKey: meiliKey, index } = getMeilisearchServerConfig();

  if (!meiliUrl || !meiliKey) {
    return NextResponse.json(
      { error: 'Ricerca ristampe non disponibile' },
      { status: 503 }
    );
  }

  const cardId = safeQuery.searchParams.get('card_id') ?? '';
  if (!cardId) {
    return NextResponse.json({ error: 'Parametro card_id mancante' }, { status: 400 });
  }

  if (!isValidReprintCardId(cardId)) {
    return NextResponse.json(
      {
        error: 'card_id non valido (attesi mtg_|op_|pk_ seguito da numeri)',
        card_id: cardId,
      },
      { status: 400 }
    );
  }

  const card = await getCardDocumentById(cardId);
  if (!card) {
    return NextResponse.json({ error: 'Carta non trovata', card_id: cardId }, { status: 404 });
  }

  const searchUrl = `${meiliUrl}/indexes/${index}/search`;
  const headers: Record<string, string> = {
    'Accept-Encoding': 'identity',
    'Content-Type': 'application/json',
  };
  if (meiliKey) headers.Authorization = `Bearer ${meiliKey}`;

  const search = async (body: Record<string, unknown>) => {
    const res = await fetch(searchUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(5_000),
    });
    let hits: ReprintSearchHit[] = [];
    let estimatedTotalHits: number | undefined;
    if (res.ok) {
      const data = (await readJsonResponseWithLimit(res, 2 * 1_024 * 1_024)) as {
        hits?: ReprintSearchHit[];
        estimatedTotalHits?: number;
      };
      hits = Array.isArray(data.hits) ? data.hits : [];
      estimatedTotalHits = data.estimatedTotalHits;
    }
    return { ok: res.ok, status: res.status, hits, estimatedTotalHits };
  };

  try {
    const hits = await fetchReprintsForCard(card, search);
    const payload: ReprintsApiResponse = {
      card_id: card.id,
      oracle_id: card.oracle_id ?? null,
      card_entity_id: card.card_id ?? null,
      count: hits.length,
      hits: hits.map((hit) => sanitizeCatalogImageFields(hit)),
    };
    return NextResponse.json(payload, {
      headers: {
        // Catalogo pubblico: cache breve lato CDN/browser + revalidate in background.
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Ricerca ristampe non disponibile' },
      { status: 502 }
    );
  }
}
