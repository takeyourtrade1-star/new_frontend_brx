/**
 * API Route: dettaglio prodotto/carta per id (es. mtg_123, op_456, sealed_10).
 * Recupera il prodotto tramite l'API search: la chiave runtime resta limitata
 * alla sola azione `search` e non necessita accesso ai documenti.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMeilisearchServerConfig } from '@/lib/meilisearch-server-env';
import { readJsonResponseWithLimit } from '@/app/api/_lib/bounded-json-response';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';
import {
  buildCatalogIdFilter,
  normalizeCatalogProductId,
  safePublicImageUrl,
} from '@/lib/security/catalog-public-data';

export interface ProductDetailDoc {
  id: string;
  name: string;
  set_name: string;
  game_slug: string;
  category_id?: number;
  category_name?: string;
  image?: string | null;
  keywords_localized?: string[];
  /** MTG: per pagina dettaglio */
  collector_number?: string;
  rarity?: string;
  available_languages?: string[];
}

export interface ProductDetailResponse {
  id: string;
  name: string;
  set_name: string;
  game_slug: string;
  category_name?: string;
  imageUrl: string | null;
  keywords_localized?: string[];
  collector_number?: string;
  rarity?: string;
  available_languages?: string[];
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const rateLimit = await checkRateLimit(request, {
    scope: 'catalog:product-detail',
    limit: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimitExceededResponse(rateLimit);
  if (request.nextUrl.search) {
    return NextResponse.json({ error: 'Query non valida' }, { status: 400 });
  }

  const { id: rawId } = await context.params;
  const id = normalizeCatalogProductId(rawId);
  const filter = buildCatalogIdFilter(rawId);
  if (!id || !filter) {
    return NextResponse.json({ error: 'Id non valido' }, { status: 400 });
  }

  const { url: MEILI_URL, apiKey: MEILI_KEY, index: INDEX } = getMeilisearchServerConfig();

  if (!MEILI_URL || !MEILI_KEY) {
    return NextResponse.json(
      { error: 'Catalogo non disponibile' },
      { status: 503 }
    );
  }

  const searchUrl = `${MEILI_URL}/indexes/${INDEX}/search`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept-Encoding': 'identity',
    Authorization: `Bearer ${MEILI_KEY}`,
  };

  try {
    const upstreamResponse = await fetch(searchUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filter,
        limit: 1,
      }),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(5_000),
    });
    const data = upstreamResponse.ok
      ? ((await readJsonResponseWithLimit(upstreamResponse, 512 * 1_024)) as {
          hits?: ProductDetailDoc[];
        })
      : null;
    const doc = data?.hits?.[0]?.id === id ? data.hits[0] : null;

    if (!doc) {
      return NextResponse.json({ error: 'Prodotto non trovato' }, { status: 404 });
    }
    const imageUrl = safePublicImageUrl(doc.image ?? null, 'card');

    const response: ProductDetailResponse = {
      id: doc.id,
      name: doc.name ?? '',
      set_name: doc.set_name ?? '',
      game_slug: doc.game_slug ?? 'mtg',
      category_name: doc.category_name ?? undefined,
      imageUrl,
      keywords_localized: doc.keywords_localized,
      collector_number: doc.collector_number,
      rarity: doc.rarity,
      available_languages: doc.available_languages,
    };

    return NextResponse.json(response, {
      headers: {
        // Catalogo pubblico: cache breve lato CDN/browser + revalidate in background.
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Errore recupero dettaglio' },
      { status: 502 }
    );
  }
}
