'use client';

/**
 * Pagina Singles – layout stile Cardmarket:
 * Breadcrumb Prodotti (game) / Singles, filtri (Categoria, Edizione, Nome, Nome esatto, Solo disponibile),
 * CERCA, Mostra opzioni filtri, Ordina per, VISTA LISTA / VISTA GRIGLIA, dati da /api/search (Meilisearch).
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ChevronDown, ChevronLeft, ChevronRight, Rows3, Grid2x2, Camera, Eye } from 'lucide-react';
import { getCardImageUrl } from '@/lib/assets';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import type { SearchHit } from '@/app/api/search/route';
import type { GameSlug } from '@/lib/contexts/GameContext';
import { cn } from '@/lib/utils';

const BACKEND_LANG_ORDER = ['en', 'de', 'es', 'fr', 'it', 'pt'] as const;
type SupportedLang = (typeof BACKEND_LANG_ORDER)[number];

function normalizeLang(lang: string): SupportedLang {
  return BACKEND_LANG_ORDER.includes(lang as SupportedLang) ? (lang as SupportedLang) : 'en';
}

function getLocalizedName(keywords: string[] | undefined, lang: string): string | null {
  if (!keywords?.length) return null;
  const l = normalizeLang(lang);
  const idx = BACKEND_LANG_ORDER.indexOf(l);
  if (idx < 0 || !keywords[idx]) return null;
  const raw = keywords[idx];
  return (typeof raw === 'string' ? raw : '').trim() || null;
}

function getDisplayNames(
  hit: SearchHit,
  currentLang: string
): { primary: string; secondary: string | null } {
  const primary = getLocalizedName(hit.keywords_localized, currentLang) ?? hit.name;
  const secondary = currentLang !== 'en' ? hit.name : null;
  return { primary, secondary };
}

const GAME_LABELS: Record<string, string> = {
  mtg: 'MAGIC: THE GATHERING',
  op: 'ONE PIECE',
  pokemon: 'POKÉMON',
};

const GAME_TO_MEILISEARCH: Record<string, string> = {
  mtg: 'mtg',
  pokemon: 'pokemon',
  op: 'one-piece',
};

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Più popolare' },
  { value: 'name_desc', label: 'Nome Z-A' },
  { value: 'set_asc', label: 'Edizione A-Z' },
  { value: 'set_desc', label: 'Edizione Z-A' },
  { value: 'price_asc', label: 'Prezzo crescente' },
  { value: 'price_desc', label: 'Prezzo decrescente' },
] as const;

type ViewMode = 'list' | 'grid';

interface SearchApiResponse {
  hits: SearchHit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Hit esteso con campi opzionali restituiti da Meilisearch (rarity, collector_number, prezzi). */
type SinglesHit = SearchHit & {
  rarity?: string;
  collector_number?: string;
  market_price?: number;
  foil_price?: number;
};

const BRAND_ORANGE = '#FF8800';

export interface ProductCategoryViewProps {
  game: GameSlug | null;
  /** Titolo pagina (es. "Singles", "Boosters") */
  title: string;
  /** Slug per URL (es. "singles", "boosters") */
  categorySlug: string;
  /** Testo per il select Categoria */
  categoryLabel: string;
  /** Opzionale: category_id per filtrare su Meilisearch (sealed, boosters, ecc.) */
  categoryId?: number;
  /** Mostra colonne Numero e Rarità (solo per singles) */
  showCardDetails?: boolean;
}

export function ProductCategoryView({
  game: gameSlug,
  title,
  categorySlug,
  categoryLabel,
  categoryId,
  showCardDetails = false,
}: ProductCategoryViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedLang } = useLanguage();

  const gameFromUrl = searchParams.get('game');
  const effectiveGame = ((gameFromUrl as GameSlug) || gameSlug) ?? 'mtg';
  const apiGame = GAME_TO_MEILISEARCH[effectiveGame] || effectiveGame;
  const gameLabel = GAME_LABELS[effectiveGame] ?? effectiveGame.toUpperCase();

  const q = (searchParams.get('q') ?? '').trim();
  const setFilter = searchParams.get('set') ?? '';
  const pageParam = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const sortParam = (searchParams.get('sort') ?? 'name_asc') as string;

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [nomeInput, setNomeInput] = useState(q);
  const [edizioneInput, setEdizioneInput] = useState(setFilter);
  const [nomeEsatto, setNomeEsatto] = useState(false);
  const [soloDisponibile, setSoloDisponibile] = useState(false);
  const [showExtraFilters, setShowExtraFilters] = useState(false);
  const [data, setData] = useState<SearchApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNomeInput(q);
    setEdizioneInput(setFilter);
  }, [q, setFilter]);

  const buildUrl = useCallback(
    (updates: Record<string, string>) => {
      const p = new URLSearchParams(searchParams.toString());
      if (!p.get('game')) p.set('game', effectiveGame);
      Object.entries(updates).forEach(([k, v]) => {
        if (v) p.set(k, v);
        else p.delete(k);
      });
      return `/products/${categorySlug}?${p.toString()}`;
    },
    [searchParams, effectiveGame, categorySlug]
  );

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set('game', apiGame);
    // Nome + Edizione in un'unica query: Meilisearch cerca in tutti i campi searchable (es. name, set_name)
    // così "Alpha" o "30th" trovano i set senza richiedere il nome esatto del set.
    const queryParts: string[] = [];
    if (nomeInput.trim()) {
      queryParts.push(nomeEsatto ? `"${nomeInput.trim()}"` : nomeInput.trim());
    }
    if (edizioneInput.trim()) {
      queryParts.push(edizioneInput.trim());
    }
    const q = queryParts.join(' ');
    if (q) params.set('q', q);
    if (categoryId != null) params.set('category_id', String(categoryId));
    params.set('page', String(pageParam));
    params.set('limit', '30');
    params.set('sort', sortParam);
    try {
      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || j?.detail || `Errore ${res.status}`);
      }
      const json: SearchApiResponse = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [apiGame, nomeInput, nomeEsatto, edizioneInput, categoryId, pageParam, sortParam]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const total = data?.total ?? 0;
  const hits = (data?.hits ?? []) as SinglesHit[];
  const currentPage = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;

  const handleCerca = () => {
    router.push(buildUrl({ q: nomeInput.trim(), set: edizioneInput.trim(), page: '1' }));
  };

  const formatEuro = (n: number | undefined) =>
    n != null ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n) : '–';

  return (
    <section className="min-h-screen pb-12 bg-[#F0F0F0]">
      <div className="container-content py-4 sm:py-6">
        {/* Breadcrumb: Prodotti (game) / [titolo categoria] - NASCOSTO */
        /*
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Link href="/products" className="hover:text-gray-900">
            Prodotti ({gameLabel})
          </Link>
          <span>/</span>
          <span className="font-semibold text-gray-900">{title}</span>
        </nav>
        */}

        {/* Solo il menu Categoria - NASCOSTO */
        /*
        <div className="mb-4">
          <label className="flex flex-col gap-1 text-gray-700 text-xs font-semibold uppercase w-fit">
            Categoria
            <select
              className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[140px] bg-gray-50 text-gray-900"
              value={categorySlug}
              disabled
              aria-label="Categoria corrente"
            >
              <option value={categorySlug}>{categoryLabel}</option>
            </select>
          </label>
        </div>
        */}

        {/* Barra risultati + vista lista/griglia */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 border border-gray-200 rounded-lg bg-white mb-4">
          <p className="text-gray-700 text-sm">
            <strong>{total}</strong> Risultati
            {total > 0 && (
              <span className="ml-2 text-gray-500">
                – Ricerca avanzata
              </span>
            )}
          </p>
          <div className="flex overflow-hidden rounded-md border border-gray-200">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'px-4 py-2 text-sm font-bold uppercase flex items-center gap-1.5 transition-colors',
                viewMode === 'list'
                  ? 'text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
              style={viewMode === 'list' ? { backgroundColor: BRAND_ORANGE } : undefined}
            >
              <Rows3 className="w-4 h-4" />
              Vista lista
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                'px-4 py-2 text-sm font-bold uppercase flex items-center gap-1.5 border-l border-gray-200 transition-colors',
                viewMode === 'grid'
                  ? 'text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
              style={viewMode === 'grid' ? { backgroundColor: BRAND_ORANGE } : undefined}
            >
              <Grid2x2 className="w-4 h-4" />
              Vista griglia
            </button>
          </div>
        </div>

        {/* Contenuto: tabella lista o griglia */}
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          {error && (
            <div className="p-6 text-center text-red-600 bg-red-50">{error}</div>
          )}
          {loading && (
            <div className="p-12 text-center text-gray-500">Caricamento...</div>
          )}
          {!loading && !error && hits.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              Nessun risultato. Prova a cambiare filtri o termine di ricerca.
            </div>
          )}

          {!loading && !error && hits.length > 0 && viewMode === 'list' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr
                    className="text-left text-xs font-semibold uppercase tracking-wider text-white"
                    style={{ backgroundColor: BRAND_ORANGE }}
                  >
                    <th className="p-3 w-24"></th>
                    <th className="p-3 w-48">Nome</th>
                    {showCardDetails && (
                      <>
                        <th className="p-3 text-center">Numero</th>
                        <th className="p-3 text-center">Rarità</th>
                      </>
                    )}
                    <th className="p-3 text-center">Disponibile</th>
                    <th className="p-3 text-center">Da</th>
                    <th className="p-3 text-center">Disponibile (Foil)</th>
                    <th className="p-3 text-center">Da (Foil)</th>
                  </tr>
                </thead>
                <tbody>
                  {hits.map((hit) => {
                    const productHref = `/products/${hit.id}`;
                    const imgUrl = getCardImageUrl(hit.image ?? null);
                    const { primary, secondary } = getDisplayNames(hit, selectedLang);
                    return (
                      <tr
                        key={hit.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => router.push(productHref)}
                        onKeyDown={(e) => e.key === 'Enter' && router.push(productHref)}
                        className="border-b border-gray-100 hover:bg-orange-50/50 cursor-pointer transition-colors"
                      >
                        <td className="p-2" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className="p-1.5 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                              aria-label="Anteprima immagine"
                            >
                              <Camera className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              className="p-1.5 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                              aria-label="Vista rapida"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="p-3">
                          <Link
                            href={productHref}
                            className="flex items-center gap-3 hover:opacity-90"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {imgUrl ? (
                              <div className="relative w-10 h-14 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                                <Image
                                  src={imgUrl}
                                  alt={primary}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-14 flex-shrink-0 rounded bg-gray-200" />
                            )}
                            <div>
                              <span className="font-semibold text-gray-900">{primary}</span>
                              {secondary && (
                                <p className="text-xs text-gray-500">{secondary}</p>
                              )}
                              {hit.set_name && (
                                <p className="text-xs text-gray-500">{hit.set_name}</p>
                              )}
                            </div>
                          </Link>
                        </td>
                        {showCardDetails && (
                          <>
                            <td className="p-3 text-center text-gray-600">
                              {hit.collector_number ?? '–'}
                            </td>
                            <td className="p-3 text-center text-gray-600">
                              {hit.rarity ?? '–'}
                            </td>
                          </>
                        )}
                        <td className="p-3 text-center text-gray-600">–</td>
                        <td className="p-3 text-center font-semibold" style={{ color: BRAND_ORANGE }}>
                          {formatEuro(hit.market_price)}
                        </td>
                        <td className="p-3 text-center text-gray-600">–</td>
                        <td className="p-3 text-center font-semibold" style={{ color: BRAND_ORANGE }}>
                          {formatEuro(hit.foil_price)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && hits.length > 0 && viewMode === 'grid' && (
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {hits.map((hit) => {
                const imgUrl = getCardImageUrl(hit.image ?? null);
                const { primary, secondary } = getDisplayNames(hit, selectedLang);
                return (
                  <Link
                    key={hit.id}
                    href={`/products/${hit.id}`}
                    className="group border border-gray-200 rounded-lg bg-white p-3 hover:border-[#FF8800] hover:shadow-md transition-all"
                  >
                    <div className="relative aspect-[63/88] overflow-hidden rounded bg-gray-100 mb-2">
                      {imgUrl ? (
                        <Image
                          src={imgUrl}
                          alt={primary}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform"
                          sizes="(max-width:640px) 50vw, 20vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No img
                        </div>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 text-sm line-clamp-2">{primary}</p>
                    {secondary && (
                      <p className="text-xs text-gray-500 line-clamp-1">{secondary}</p>
                    )}
                    {hit.set_name && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{hit.set_name}</p>
                    )}
                    <p className="font-semibold text-sm mt-1" style={{ color: BRAND_ORANGE }}>
                      Da {formatEuro((hit as SinglesHit).market_price)}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Paginazione */}
          {!loading && !error && totalPages > 1 && (
            <div
              className="flex items-center justify-center gap-2 py-4 px-4 text-white"
              style={{ backgroundColor: BRAND_ORANGE }}
            >
              <Link
                href={buildUrl({ page: String(Math.max(1, currentPage - 1)) })}
                className={cn(
                  'p-2 rounded transition-opacity',
                  currentPage <= 1 ? 'opacity-50 pointer-events-none' : 'hover:opacity-90'
                )}
                aria-label="Pagina precedente"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <span className="px-4 font-bold uppercase text-sm">
                Pagina {currentPage} di {totalPages}
              </span>
              <Link
                href={buildUrl({ page: String(Math.min(totalPages, currentPage + 1)) })}
                className={cn(
                  'p-2 rounded transition-opacity',
                  currentPage >= totalPages ? 'opacity-50 pointer-events-none' : 'hover:opacity-90'
                )}
                aria-label="Pagina successiva"
              >
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** Wrapper per la pagina Singles: stessa UI con titolo e categoria "Singles". */
export function SinglesView({ game }: { game: GameSlug | null }) {
  return (
    <ProductCategoryView
      game={game}
      title="Singles"
      categorySlug="singles"
      categoryLabel="Singles"
      showCardDetails={true}
    />
  );
}
