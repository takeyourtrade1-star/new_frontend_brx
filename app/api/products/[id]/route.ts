/**
 * API Route: dettaglio prodotto/carta per id (es. mtg_123, op_456, sealed_10).
 * Recupera il documento da Meilisearch e restituisce dati per la pagina dettaglio (titolo, immagine, breadcrumb).
 */

import { NextRequest, NextResponse } from 'next/server';

const MEILI_URL = (
  process.env.NEXT_PUBLIC_MEILISEARCH_URL ||
  process.env.VITE_MEILISEARCH_URL ||
  ''
).replace(/\/+$/, '');
const MEILI_KEY =
  process.env.NEXT_PUBLIC_MEILISEARCH_API_KEY ||
  process.env.VITE_MEILISEARCH_API_KEY ||
  '';
const INDEX = process.env.NEXT_PUBLIC_MEILISEARCH_INDEX || 'cards';
const CDN_URL = (process.env.NEXT_PUBLIC_CDN_URL || '').replace(/\/+$/, '');

function buildImageUrl(raw: string | null | undefined): string | null {
  if (raw == null || raw === '') return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith('http')) return trimmed;
  const path = trimmed
    .replace(/^\/img\//, '')
    .replace(/^img\//, '');
  if (!path) return null;
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  return CDN_URL ? `${CDN_URL}${withSlash}` : withSlash;
}

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
  const { id } = await context.params;
  if (!id || !id.trim()) {
    return NextResponse.json({ error: 'Id mancante' }, { status: 400 });
  }

  if (!MEILI_URL) {
    return NextResponse.json(
      { error: 'Meilisearch non configurato (NEXT_PUBLIC_MEILISEARCH_URL)' },
      { status: 503 }
    );
  }

  const docUrl = `${MEILI_URL}/indexes/${INDEX}/documents/${encodeURIComponent(id.trim())}`;
  const headers: Record<string, string> = {};
  if (MEILI_KEY) headers.Authorization = `Bearer ${MEILI_KEY}`;

  try {
    let res = await fetch(docUrl, { method: 'GET', headers });
    let doc: ProductDetailDoc | null = null;

    if (res.ok) {
      doc = (await res.json()) as ProductDetailDoc;
    } else if (res.status === 403 || res.status === 401) {
      // Chiave senza permesso GET document: fallback a search con filtro id (come pagina dettaglio)
      const searchRes = await fetch(`${MEILI_URL}/indexes/${INDEX}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          filter: `id = "${id.trim().replace(/"/g, '\\"')}"`,
          limit: 1,
        }),
      });
      if (searchRes.ok) {
        const data = (await searchRes.json()) as { hits?: ProductDetailDoc[] };
        doc = data.hits?.[0] ?? null;
      }
    }

    if (!doc) {
      return NextResponse.json({ error: 'Prodotto non trovato' }, { status: 404 });
    }
    const imageUrl = buildImageUrl(doc.image ?? null);

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

    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'Errore recupero dettaglio', detail: message },
      { status: 502 }
    );
  }
}
