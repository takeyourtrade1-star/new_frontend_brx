import type { SearchHit } from '@/app/api/search/route';
import type { ScambioGame, ScambioUI } from '@/components/feature/scambi/scambi-types';
import { filterHitsWithLoadableImages, hasResolvableCardImage } from '@/lib/scambi/scambi-image-validation';

type SearchApiResponse = {
  hits: SearchHit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const PREVIEW_CONDITIONS = ['Near Mint', 'Lightly Played', 'Moderately Played', 'Mint'] as const;

const PREVIEW_SELLERS = [
  { seller: 'MarcoTCG', sellerCountry: 'IT', sellerRating: 99, sellerReviewCount: 124 },
  { seller: 'GiuliaCards', sellerCountry: 'IT', sellerRating: 97, sellerReviewCount: 58 },
  { seller: 'VintageMTG', sellerCountry: 'IT', sellerRating: 96, sellerReviewCount: 88 },
  { seller: 'LorenzoSpells', sellerCountry: 'IT', sellerRating: 98, sellerReviewCount: 210 },
  { seller: 'ElenaCollects', sellerCountry: 'IT', sellerRating: 95, sellerReviewCount: 32 },
  { seller: 'FabioDeck', sellerCountry: 'IT', sellerRating: 100, sellerReviewCount: 45 },
  { seller: 'AndreaMox', sellerCountry: 'IT', sellerRating: 94, sellerReviewCount: 12 },
  { seller: 'SaraPlanes', sellerCountry: 'IT', sellerRating: 99, sellerReviewCount: 300 },
] as const;

/** Query MTG variegate per ottenere carte casuali dal catalogo reale. */
const MTG_RANDOM_QUERIES = [
  'lightning',
  'island',
  'dragon',
  'angel',
  'shock',
  'forest',
  'counter',
  'legendary',
  'artifact',
  'planeswalker',
  'goblin',
  'elf',
  'wrath',
  'bolt',
  'mox',
] as const;

let catalogCache: ScambioUI[] = [];
let catalogPromise: Promise<ScambioUI[]> | null = null;

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function gameSlugToScambioGame(slug: string): ScambioGame {
  const map: Record<string, ScambioGame> = {
    mtg: 'mtg',
    pokemon: 'pokemon',
    'one-piece': 'op',
    yugioh: 'ygo',
    lorcana: 'lorcana',
  };
  return map[slug] ?? 'other';
}

async function fetchSearchPage(params: {
  q?: string;
  page: number;
  limit: number;
  game?: string;
}): Promise<SearchHit[]> {
  const search = new URLSearchParams({
    game: params.game ?? 'mtg',
    limit: String(params.limit),
    page: String(params.page),
    sort: 'name_asc',
  });
  if (params.q?.trim()) search.set('q', params.q.trim());

  const res = await fetch(`/api/search?${search.toString()}`);
  if (!res.ok) return [];
  const data = (await res.json()) as SearchApiResponse;
  return Array.isArray(data.hits) ? data.hits : [];
}

async function collectMtgHitsWithImages(targetCount: number): Promise<Array<SearchHit & { imageUrl: string }>> {
  const seenIds = new Set<string>();
  const rawHits: SearchHit[] = [];
  const queries = shuffle(MTG_RANDOM_QUERIES);

  for (const q of queries) {
    if (rawHits.length >= targetCount * 6) break;
    const page = Math.floor(Math.random() * 8) + 1;
    const batch = await fetchSearchPage({ q, page, limit: 40, game: 'mtg' });
    for (const hit of batch) {
      if (seenIds.has(hit.id)) continue;
      if (!hasResolvableCardImage(hit.image)) continue;
      seenIds.add(hit.id);
      rawHits.push(hit);
    }
  }

  if (rawHits.length < targetCount * 2) {
    const fallbackPage = Math.floor(Math.random() * 12) + 1;
    const fallback = await fetchSearchPage({ page: fallbackPage, limit: 60, game: 'mtg' });
    for (const hit of fallback) {
      if (seenIds.has(hit.id)) continue;
      if (!hasResolvableCardImage(hit.image)) continue;
      seenIds.add(hit.id);
      rawHits.push(hit);
    }
  }

  return filterHitsWithLoadableImages(rawHits, targetCount * 2);
}

function buildScambioTitle(hit: SearchHit): string {
  const name = hit.name?.trim() || 'Carta MTG';
  const set = hit.set_name?.trim();
  const number = hit.collector_number?.trim();
  if (set && number) return `${name} — ${set} #${number}`;
  if (set) return `${name} — ${set}`;
  return name;
}

function buildWantsInReturn(offerHit: SearchHit, otherHits: SearchHit[]): string {
  const candidates = otherHits.filter((h) => h.id !== offerHit.id);
  const pick = candidates[Math.floor(Math.random() * candidates.length)] ?? offerHit;
  const name = pick.name?.trim() || 'Carte MTG equivalenti';
  const set = pick.set_name?.trim();
  return set ? `${name} (${set})` : name;
}

function mapHitToScambio(
  hit: SearchHit & { imageUrl: string },
  index: number,
  allHits: Array<SearchHit & { imageUrl: string }>
): ScambioUI {
  const seller = PREVIEW_SELLERS[index % PREVIEW_SELLERS.length];
  const condition = PREVIEW_CONDITIONS[index % PREVIEW_CONDITIONS.length];
  const title = buildScambioTitle(hit);
  const numericId = index + 1;

  return {
    id: String(numericId),
    numericId,
    title,
    image: hit.imageUrl,
    seller: seller.seller,
    sellerCountry: seller.sellerCountry,
    sellerRating: seller.sellerRating,
    sellerReviewCount: seller.sellerReviewCount,
    game: gameSlugToScambioGame(hit.game_slug),
    description: `Anteprima scambio: ${title}. Condizione ${condition}. Catalogo collegato a Meilisearch.`,
    imageFront: hit.imageUrl,
    imageBack: hit.imageUrl,
    condition,
    createdByUserId: null,
    wantsInReturn: buildWantsInReturn(hit, allHits),
  };
}

async function loadCatalog(count: number): Promise<ScambioUI[]> {
  let hits = await collectMtgHitsWithImages(count);

  if (hits.length < count) {
    const extra = await collectMtgHitsWithImages(count * 2);
    const seen = new Set(hits.map((h) => h.id));
    for (const hit of extra) {
      if (hits.length >= count) break;
      if (seen.has(hit.id)) continue;
      seen.add(hit.id);
      hits.push(hit);
    }
  }

  if (hits.length === 0) return [];

  const shuffled = shuffle(hits);
  const selected = shuffled.slice(0, count);
  const rows = selected.map((hit, index) => mapHitToScambio(hit, index, selected));
  catalogCache = rows;
  return rows;
}

export async function fetchScambiCatalog(count = 12): Promise<ScambioUI[]> {
  if (catalogCache.length >= count) return catalogCache.slice(0, count);
  if (!catalogPromise) {
    catalogPromise = loadCatalog(count).finally(() => {
      catalogPromise = null;
    });
  }
  return catalogPromise;
}

export function getScambiCatalog(): ScambioUI[] {
  return catalogCache;
}

export function getScambioById(id: string): ScambioUI | null {
  return catalogCache.find((row) => row.id === id) ?? null;
}

export async function fetchScambioById(id: string): Promise<ScambioUI | null> {
  const cached = getScambioById(id);
  if (cached) return cached;
  if (catalogCache.length === 0) {
    await fetchScambiCatalog(12);
  }
  return getScambioById(id);
}
