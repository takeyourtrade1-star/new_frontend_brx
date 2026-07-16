import { NextRequest, NextResponse } from 'next/server';

import { getMeilisearchServerConfig } from '@/lib/meilisearch-server-env';
import {
  escapeMeiliFilterValue,
  fetchMeiliWithTimeout,
  MeiliFetchError,
  normalizeQuery,
  normalizeSetName,
  publicStatusForMeiliStatus,
} from '@/lib/search/search-request-utils';
import type { ScanCatalogCard } from '@/hooks/scanner/scanner-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BATCH = 100;
const CANDIDATES_PER_CARD = 5;

interface ScannerCandidateDescriptor {
  id: string;
  cardName: string;
  setName: string;
  setCode: string;
  collectorNumber: string;
}

interface CatalogHit {
  id?: unknown;
  cardtrader_id?: unknown;
  name?: unknown;
  set_name?: unknown;
  set_code?: unknown;
  collector_number?: unknown;
  image?: unknown;
  available_languages?: unknown;
  market_price?: unknown;
  foil_price?: unknown;
}

interface MultiSearchResult {
  hits?: CatalogHit[];
}

export interface ScannerCatalogCandidatesResponse {
  results: Record<string, ScanCatalogCard[]>;
}

function cleanString(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function parseDescriptors(value: unknown): ScannerCandidateDescriptor[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const descriptors: ScannerCandidateDescriptor[] = [];
  for (const raw of value.slice(0, MAX_BATCH)) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Record<string, unknown>;
    const id = cleanString(item.id, 128);
    const cardName = normalizeQuery(cleanString(item.cardName, 200));
    if (!id || !cardName || seen.has(id)) continue;
    seen.add(id);
    descriptors.push({
      id,
      cardName,
      setName: normalizeSetName(cleanString(item.setName, 200)),
      setCode: cleanString(item.setCode, 32),
      collectorNumber: cleanString(item.collectorNumber, 32),
    });
  }
  return descriptors;
}

function finiteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function mapHit(hit: CatalogHit): ScanCatalogCard | null {
  const cardId = cleanString(hit.id, 128);
  const name = cleanString(hit.name, 300);
  if (!cardId || !name) return null;
  const blueprint = finiteNumber(hit.cardtrader_id);
  const languages = Array.isArray(hit.available_languages)
    ? hit.available_languages
        .map((value) => cleanString(value, 10).toLowerCase())
        .filter(Boolean)
    : [];
  return {
    cardId,
    blueprintId: blueprint && Number.isInteger(blueprint) && blueprint > 0 ? blueprint : null,
    name,
    setName: cleanString(hit.set_name, 200),
    setCode: cleanString(hit.set_code, 32) || null,
    collectorNumber: cleanString(hit.collector_number, 32) || null,
    image: cleanString(hit.image, 1_000) || null,
    availableLanguages: [...new Set(languages)],
    marketPrice: finiteNumber(hit.market_price),
    foilPrice: finiteNumber(hit.foil_price),
  };
}

function normalizeComparable(value: string): string {
  return value.trim().toLocaleLowerCase('en-US');
}

function rankHits(
  descriptor: ScannerCandidateDescriptor,
  hits: CatalogHit[],
): ScanCatalogCard[] {
  const cards = hits.map(mapHit).filter((card): card is ScanCatalogCard => card !== null);
  const targetName = normalizeComparable(descriptor.cardName);
  const targetSet = normalizeComparable(descriptor.setName);
  const targetCollector = normalizeComparable(descriptor.collectorNumber);
  cards.sort((left, right) => {
    const score = (card: ScanCatalogCard) =>
      (normalizeComparable(card.name) === targetName ? 8 : 0) +
      (targetSet && normalizeComparable(card.setName) === targetSet ? 4 : 0) +
      (targetCollector && normalizeComparable(card.collectorNumber ?? '') === targetCollector ? 2 : 0) +
      (card.blueprintId ? 1 : 0);
    return score(right) - score(left);
  });
  return cards.slice(0, CANDIDATES_PER_CARD);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON non valido' }, { status: 400 });
  }
  const descriptors = parseDescriptors(
    body && typeof body === 'object' ? (body as { items?: unknown }).items : null,
  );
  if (descriptors.length === 0) {
    return NextResponse.json({ results: {} } satisfies ScannerCatalogCandidatesResponse);
  }

  const { url, apiKey, index } = getMeilisearchServerConfig();
  if (!url) {
    return NextResponse.json({ error: 'Catalogo non configurato' }, { status: 503 });
  }

  const attributesToRetrieve = [
    'id',
    'cardtrader_id',
    'name',
    'set_name',
    'set_code',
    'collector_number',
    'image',
    'available_languages',
    'market_price',
    'foil_price',
  ];
  const queries = descriptors.map((descriptor) => {
    const filters = ['game_slug = "mtg"'];
    if (descriptor.setName) {
      filters.push(`set_name = "${escapeMeiliFilterValue(descriptor.setName)}"`);
    }
    return {
      indexUid: index,
      q: descriptor.cardName,
      filter: filters.join(' AND '),
      limit: CANDIDATES_PER_CARD,
      attributesToRetrieve,
    };
  });

  try {
    const response = await fetchMeiliWithTimeout(`${url}/multi-search`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({ queries }),
    });
    if (!response.ok) {
      return NextResponse.json(
        { error: `Catalogo non disponibile (${response.status})` },
        { status: publicStatusForMeiliStatus(response.status) },
      );
    }
    const data = (await response.json()) as { results?: MultiSearchResult[] };
    const results: Record<string, ScanCatalogCard[]> = {};
    descriptors.forEach((descriptor, indexPosition) => {
      const hits = data.results?.[indexPosition]?.hits ?? [];
      results[descriptor.id] = rankHits(descriptor, hits);
    });
    return NextResponse.json(
      { results } satisfies ScannerCatalogCandidatesResponse,
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    if (error instanceof MeiliFetchError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Catalogo non disponibile' }, { status: 502 });
  }
}
