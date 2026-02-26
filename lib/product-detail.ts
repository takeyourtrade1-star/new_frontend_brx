/**
 * Recupero dettaglio prodotto/carta da Meilisearch per id (server-side).
 * Usato dalla pagina /products/[slug] quando slug è un id indice (mtg_123, op_456, sealed_10).
 */

const MEILI_URL_RAW = (
  process.env.NEXT_PUBLIC_MEILISEARCH_URL ||
  process.env.NEXT_PUBLIC_MEILISEARCH_HOST ||
  process.env.VITE_MEILISEARCH_URL ||
  process.env.VITE_MEILISEARCH_HOST ||
  ''
).replace(/\/+$/, '');
const MEILI_URL =
  MEILI_URL_RAW ||
  (process.env.NODE_ENV === 'development' ? 'http://35.152.143.30:7700' : '');
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
  const path = trimmed.replace(/^\/img\//, '').replace(/^img\//, '');
  if (!path) return null;
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  return CDN_URL ? `${CDN_URL}${withSlash}` : withSlash;
}

/** Documento carta/prodotto come restituito da Meilisearch (allineato all'indexer search_engine). */
export interface CardDocument {
  id: string;
  name: string;
  set_name: string;
  game_slug: string;
  image?: string | null;
  category_name?: string;
  /** CardTrader blueprint ID (per fetch listings/venditori). */
  cardtrader_id?: number;
  /** MTG: Rare, Mythic, Common, Uncommon, etc. */
  rarity?: string;
  /** MTG: numero collezionista (es. "028", "1910"). */
  collector_number?: string;
  /** MTG: codici lingua in cui la carta è disponibile (es. ["en","it","fr"]). */
  available_languages?: string[];
  market_price?: number;
  foil_price?: number;
  keywords_localized?: string[];
}

export interface ProductDetailData {
  id: string;
  name: string;
  set_name: string;
  game_slug: string;
  category_name?: string;
  imageUrl: string | null;
  keywords_localized?: string[];
  /** MTG: per pagina dettaglio */
  collector_number?: string;
  rarity?: string;
  available_languages?: string[];
}

const GAME_LABELS: Record<string, string> = {
  mtg: 'MAGIC: THE GATHERING',
  op: 'ONE PIECE',
  pk: 'POKÉMON',
  pokemon: 'POKÉMON',
};

export function getGameLabel(gameSlug: string): string {
  return GAME_LABELS[gameSlug] ?? gameSlug.toUpperCase();
}

/** Restituisce true se slug è un id documento Meilisearch (mtg_123, op_456, pk_789, sealed_10). */
export function isIndexProductId(slug: string): boolean {
  return /^(mtg_|op_|pk_|sealed_)\d+$/.test(slug);
}

/**
 * Recupera il documento carta da Meilisearch per id (stesso flusso del debug meilisearch-product).
 * 1) GET /documents/:id → se 403/401/404 fa 2) POST /search con filter id = ":id".
 * Restituisce CardDocument per la pagina dettaglio, null se non trovato.
 * Usa cache: 'no-store' per evitare di cachare una risposta 403.
 */
export async function getCardDocumentById(id: string): Promise<CardDocument | null> {
  const rawId = id?.trim();
  if (!rawId || !MEILI_URL) return null;

  const headers: Record<string, string> = {};
  if (MEILI_KEY) headers.Authorization = `Bearer ${MEILI_KEY}`;

  try {
    const docUrl = `${MEILI_URL}/indexes/${INDEX}/documents/${encodeURIComponent(rawId)}`;
    const res = await fetch(docUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (res.ok) {
      return (await res.json()) as CardDocument;
    }

    if (res.status !== 403 && res.status !== 401 && res.status !== 404) {
      return null;
    }

    const searchUrl = `${MEILI_URL}/indexes/${INDEX}/search`;
    const filter = `id = "${rawId.replace(/"/g, '\\"')}"`;
    const searchRes = await fetch(searchUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ filter, limit: 1 }),
      cache: 'no-store',
    });

    if (!searchRes.ok) return null;
    const data = (await searchRes.json()) as { hits?: CardDocument[] };
    return data.hits?.[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Recupera il documento da Meilisearch per id. Restituisce null se non trovato o Meilisearch non configurato.
 * Se NEXT_PUBLIC_MEILISEARCH_API_KEY non è impostata, la richiesta viene fatta senza Authorization (come per la ricerca).
 */
export async function getProductById(id: string): Promise<ProductDetailData | null> {
  if (!id?.trim() || !MEILI_URL) return null;

  const url = `${MEILI_URL}/indexes/${INDEX}/documents/${encodeURIComponent(id.trim())}`;
  const headers: Record<string, string> = {};
  if (MEILI_KEY) headers.Authorization = `Bearer ${MEILI_KEY}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers,
      next: { revalidate: 60 },
    });

    if (res.status === 404 || !res.ok) return null;

    const doc = (await res.json()) as CardDocument;

    return {
      id: doc.id,
      name: doc.name ?? '',
      set_name: doc.set_name ?? '',
      game_slug: doc.game_slug ?? 'mtg',
      category_name: doc.category_name,
      imageUrl: buildImageUrl(doc.image ?? null),
      keywords_localized: doc.keywords_localized,
      collector_number: doc.collector_number,
      rarity: doc.rarity,
      available_languages: doc.available_languages,
    };
  } catch {
    return null;
  }
}

/**
 * Costruisce breadcrumb per la pagina dettaglio da product (dati Meilisearch).
 */
export function buildBreadcrumbs(product: ProductDetailData): { label: string; href?: string }[] {
  const gameLabel = getGameLabel(product.game_slug);
  const base = [
    { label: gameLabel, href: '/products' },
    { label: product.category_name ?? 'SINGLES', href: '/search' },
    { label: product.set_name || '–', href: '#' },
    { label: product.name || '–', href: undefined },
  ];
  return base;
}

/** Breadcrumb per la pagina dettaglio a partire da CardDocument (Meilisearch). */
export function buildBreadcrumbsFromCard(card: CardDocument): { label: string; href?: string }[] {
  const gameLabel = getGameLabel(card.game_slug);
  return [
    { label: gameLabel, href: '/products' },
    { label: card.category_name ?? 'SINGLES', href: '/search' },
    { label: card.set_name || '–', href: '#' },
    { label: card.name || '–', href: undefined },
  ];
}
