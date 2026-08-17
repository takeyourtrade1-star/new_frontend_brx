/**
 * POST /api/search/availability
 *
 * Restituisce il numero reale di venditori per un insieme limitato di carte.
 * La barra e la pagina risultati inviano solo gli ID catalogo/blueprint; il BFF
 * interroga in parallelo le due proiezioni pubbliche (Sync e Marketplace),
 * deduplicando lo stesso venditore tra le sorgenti.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitExceededResponse } from '@/app/api/_lib/rate-limit';
import { readJsonResponseWithLimit } from '@/app/api/_lib/bounded-json-response';
import { readTextBodyWithLimit, RequestBodyTimeoutError } from '@/app/api/_lib/request-body';
import { noStoreHeaders } from '@/app/api/_lib/proxy-response';
import { enforceJsonContentType, enforceSameOrigin } from '@/app/api/_lib/request-security';
import { fetchWithBodyDeadline } from '@/app/api/_lib/upstream-fetch';
import {
  trustedMarketplaceServiceOrigin,
  trustedSyncServiceOrigin,
} from '@/app/api/_lib/upstream-url';
import { getMarketplaceApiUrlEnv, getSyncApiUrlEnv } from '@/lib/server-runtime-env';

const MAX_CARDS = 24;
const MAX_BODY_BYTES = 8 * 1024;
const UPSTREAM_TIMEOUT_MS = 4_000;
const CONCURRENCY = 4;
const SAFE_CARD_ID = /^[a-z0-9][a-z0-9:_-]{0,127}$/i;

interface AvailabilityRequestItem {
  cardId: string;
  blueprintId: number;
}

interface PublicSellerItem {
  seller_id?: unknown;
  quantity?: unknown;
  reserved_quantity?: unknown;
}

export interface SearchAvailabilityItem {
  sellerCount: number | null;
}

export interface SearchAvailabilityResponse {
  availability: Record<string, SearchAvailabilityItem>;
}

function parseBody(value: unknown): AvailabilityRequestItem[] | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (Object.keys(body).some((key) => key !== 'cards') || !Array.isArray(body.cards)) return null;
  if (body.cards.length < 1 || body.cards.length > MAX_CARDS) return null;

  const cards: AvailabilityRequestItem[] = [];
  const seen = new Set<string>();
  for (const raw of body.cards) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const card = raw as Record<string, unknown>;
    if (Object.keys(card).some((key) => key !== 'cardId' && key !== 'blueprintId')) return null;
    if (typeof card.cardId !== 'string' || !SAFE_CARD_ID.test(card.cardId)) return null;
    if (
      typeof card.blueprintId !== 'number'
      || !Number.isSafeInteger(card.blueprintId)
      || card.blueprintId < 1
    ) return null;
    if (seen.has(card.cardId)) continue;
    seen.add(card.cardId);
    cards.push({ cardId: card.cardId, blueprintId: card.blueprintId });
  }
  return cards.length > 0 ? cards : null;
}

function availableSellerIds(items: unknown): Set<string> {
  const sellers = new Set<string>();
  if (!Array.isArray(items)) return sellers;
  for (const raw of items) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const item = raw as PublicSellerItem;
    if (typeof item.seller_id !== 'string' || !item.seller_id.trim()) continue;
    const quantity = typeof item.quantity === 'number' && Number.isFinite(item.quantity)
      ? item.quantity
      : 0;
    const reserved = typeof item.reserved_quantity === 'number' && Number.isFinite(item.reserved_quantity)
      ? Math.max(0, item.reserved_quantity)
      : 0;
    if (quantity - reserved > 0) sellers.add(item.seller_id);
  }
  return sellers;
}

async function fetchSource(
  url: URL,
  itemsKey: 'listings' | 'items',
): Promise<{ ok: boolean; sellers: Set<string> }> {
  try {
    const response = await fetchWithBodyDeadline(url, {
      method: 'GET',
      headers: { Accept: 'application/json', 'Accept-Encoding': 'identity' },
      redirect: 'error',
      cache: 'no-store',
    }, UPSTREAM_TIMEOUT_MS);
    if (!response.ok) return { ok: false, sellers: new Set() };
    const data = await readJsonResponseWithLimit(response, 512 * 1024) as Record<string, unknown>;
    return { ok: true, sellers: availableSellerIds(data[itemsKey]) };
  } catch {
    return { ok: false, sellers: new Set() };
  }
}

async function availabilityForCard(
  card: AvailabilityRequestItem,
  syncOrigin: string,
  marketplaceOrigin: string,
): Promise<SearchAvailabilityItem> {
  const requests: Array<Promise<{ ok: boolean; sellers: Set<string> }>> = [];

  if (syncOrigin) {
    requests.push(fetchSource(
      new URL(`/api/v1/sync/listings/blueprint/${card.blueprintId}`, syncOrigin),
      'listings',
    ));
  }
  if (marketplaceOrigin) {
    const marketplaceUrl = new URL(
      `/api/v1/listings/public/by-blueprint/${card.blueprintId}`,
      marketplaceOrigin,
    );
    if (/^mtg_[1-9]\d*$/.test(card.cardId)) {
      marketplaceUrl.searchParams.set('card_id', card.cardId);
    }
    requests.push(fetchSource(marketplaceUrl, 'items'));
  }

  if (requests.length === 0) return { sellerCount: null };
  const sources = await Promise.all(requests);
  // Un numero parziale sarebbe fuorviante: zero e conteggi positivi sono
  // autorevoli solo quando tutte le sorgenti configurate hanno risposto.
  if (sources.some((source) => !source.ok)) return { sellerCount: null };

  const sellers = new Set<string>();
  for (const source of sources) {
    for (const seller of source.sellers) sellers.add(seller);
  }
  return { sellerCount: sellers.size };
}

export async function POST(request: NextRequest) {
  const requestViolation = enforceSameOrigin(request) ?? enforceJsonContentType(request);
  if (requestViolation) return requestViolation;

  const rateLimit = await checkRateLimit(request, {
    scope: 'search:availability',
    limit: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return rateLimitExceededResponse(rateLimit);

  let cards: AvailabilityRequestItem[] | null = null;
  try {
    const body = await readTextBodyWithLimit(request, MAX_BODY_BYTES);
    if (body.tooLarge) {
      return NextResponse.json({ error: 'Payload troppo grande' }, { status: 413, headers: noStoreHeaders() });
    }
    cards = parseBody(JSON.parse(body.body || '{}') as unknown);
  } catch (error) {
    const status = error instanceof RequestBodyTimeoutError ? 408 : 400;
    return NextResponse.json({ error: 'Payload non valido' }, { status, headers: noStoreHeaders() });
  }
  if (!cards) {
    return NextResponse.json({ error: 'Payload non valido' }, { status: 400, headers: noStoreHeaders() });
  }

  const syncOrigin = trustedSyncServiceOrigin(getSyncApiUrlEnv());
  const marketplaceOrigin = trustedMarketplaceServiceOrigin(getMarketplaceApiUrlEnv());
  if (!syncOrigin && !marketplaceOrigin) {
    return NextResponse.json({ error: 'Disponibilita non configurata' }, { status: 503, headers: noStoreHeaders() });
  }

  // Varianti localizzate possono condividere lo stesso blueprint: una sola coppia
  // di chiamate upstream è sufficiente e il risultato viene riusato per ogni ID.
  const groups = new Map<number, AvailabilityRequestItem[]>();
  for (const card of cards) {
    const group = groups.get(card.blueprintId) ?? [];
    group.push(card);
    groups.set(card.blueprintId, group);
  }
  const uniqueCards = [...groups.values()].map((group) => group[0]);
  const byBlueprint = new Map<number, SearchAvailabilityItem>();
  let cursor = 0;
  const worker = async () => {
    while (cursor < uniqueCards.length) {
      const index = cursor++;
      const card = uniqueCards[index];
      byBlueprint.set(
        card.blueprintId,
        await availabilityForCard(card, syncOrigin, marketplaceOrigin),
      );
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, uniqueCards.length) }, () => worker()));

  const response: SearchAvailabilityResponse = {
    availability: Object.fromEntries(
      cards.map((card) => [card.cardId, byBlueprint.get(card.blueprintId) ?? { sellerCount: null }]),
    ),
  };
  return NextResponse.json(response, { headers: noStoreHeaders() });
}
