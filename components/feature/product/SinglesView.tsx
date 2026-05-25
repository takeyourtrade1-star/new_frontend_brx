'use client';

/**
 * Pagine categoria prodotti (/products/singles, boosters, …):
 * filtri in sidebar, titolo minimale, risultati con logo set come /search.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getCardImageUrl } from '@/lib/assets';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { RarityLegendProvider } from '@/components/ui/RarityLegendProvider';
import { SearchResultsTable } from '@/components/feature/search/SearchResultsTable';
import {
  SearchResultsToolbar,
  type ViewMode,
} from '@/components/feature/search/SearchResultsToolbar';
import type { SearchHit } from '@/app/api/search/route';
import type { GameSlug } from '@/lib/contexts/GameContext';
import {
  normalizeGameSlug,
  GAME_TO_MEILISEARCH,
  FRONTEND_TO_GAME_SLUG,
} from '@/lib/search/category-mapping';
import { getCategoryIdsForProductSlug } from '@/lib/product-categories';
import { cn, formatEuroNoSpace } from '@/lib/utils';

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

const SORT_DEFS: { value: string; labelKey: MessageKey }[] = [
  { value: 'name_asc', labelKey: 'search.sort.nameAsc' },
  { value: 'name_desc', labelKey: 'search.sort.nameDesc' },
  { value: 'set_asc', labelKey: 'search.sort.setAsc' },
  { value: 'set_desc', labelKey: 'search.sort.setDesc' },
  { value: 'price_asc', labelKey: 'search.sort.priceAsc' },
  { value: 'price_desc', labelKey: 'search.sort.priceDesc' },
];

const fieldClass =
  'min-h-[40px] w-full rounded-[12px] border border-gray-200 bg-[#f2f2f7] px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5AC8FA]/30';

interface SearchApiResponse {
  hits: SearchHit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type SinglesHit = SearchHit & {
  rarity?: string;
  collector_number?: string;
  market_price?: number;
  foil_price?: number;
};

const BRAND_ORANGE = '#FF8800';

export interface ProductCategoryViewProps {
  game: GameSlug | null;
  title: string;
  subtitle?: string;
  categorySlug: string;
  categoryLabel: string;
  /** @deprecated Usare getCategoryIdsForProductSlug(categorySlug) */
  categoryId?: number;
  showCardDetails?: boolean;
}

export function ProductCategoryView({
  game: gameSlug,
  title,
  categorySlug,
  categoryId,
  showCardDetails = false,
}: ProductCategoryViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedLang } = useLanguage();
  const { t } = useTranslation();

  const gameFromUrl = searchParams.get('game');
  const effectiveGame = ((gameFromUrl as GameSlug) || gameSlug) ?? 'mtg';
  const mappingGameSlug = normalizeGameSlug(
    FRONTEND_TO_GAME_SLUG[effectiveGame] ?? effectiveGame
  );
  const apiGame = GAME_TO_MEILISEARCH[mappingGameSlug ?? 'mtg'] ?? effectiveGame;

  const categoryIds = useMemo(
    () => getCategoryIdsForProductSlug(mappingGameSlug, categorySlug),
    [mappingGameSlug, categorySlug]
  );

  const q = (searchParams.get('q') ?? '').trim();
  const setFilter = searchParams.get('set') ?? '';
  const pageParam = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const sortParam = searchParams.get('sort') ?? 'name_asc';

  const sortOptions = useMemo(
    () => SORT_DEFS.map(({ value, labelKey }) => ({ value, label: t(labelKey) })),
    [t]
  );

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [nomeInput, setNomeInput] = useState(q);
  const [edizioneInput, setEdizioneInput] = useState(setFilter);
  const [raritaInput, setRaritaInput] = useState('');
  const [isRarityOpen, setIsRarityOpen] = useState(false);
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
    const queryParts: string[] = [];
    if (nomeInput.trim()) queryParts.push(nomeInput.trim());
    if (edizioneInput.trim()) queryParts.push(edizioneInput.trim());
    const combinedQ = queryParts.join(' ');
    if (combinedQ) params.set('q', combinedQ);
    if (categoryIds.length > 0) {
      params.set('category_ids', categoryIds.join(','));
    } else if (categoryId != null) {
      params.set('category_id', String(categoryId));
    }
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
  }, [apiGame, nomeInput, edizioneInput, categoryIds, categoryId, pageParam, sortParam]);

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
    n != null ? formatEuroNoSpace(n, 'it-IT') : '–';

  const pageTitle = title.toUpperCase();

  return (
    <RarityLegendProvider>
      <section className="min-h-screen pb-12 bg-[#F0F0F0]">
        <div className="container-content px-4 sm:px-6 pt-6 pb-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-gray-900">
            {pageTitle}
          </h1>
        </div>

        <div className="container-content px-4 sm:px-6 py-4">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* Sidebar filtri */}
            <aside className="w-full shrink-0 lg:w-56 xl:w-64">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sticky top-4">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                  {t('search.filtersSheetTitle')}
                </p>
                <div className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                      {t('search.filterEdition')}
                    </span>
                    <div className="relative">
                      <input
                        type="text"
                        value={edizioneInput}
                        onChange={(e) => setEdizioneInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCerca()}
                        placeholder={t('search.filterEdition')}
                        className={fieldClass}
                      />
                      {edizioneInput && (
                        <button
                          type="button"
                          onClick={() => setEdizioneInput('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
                          aria-label="Cancella edizione"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </label>

                  {categorySlug === 'singles' && (
                    <label className="flex flex-col gap-1 relative">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                        {t('search.thRarity')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsRarityOpen(!isRarityOpen)}
                        className={cn(fieldClass, 'flex items-center justify-between text-left')}
                      >
                        <span>
                          {raritaInput === 'common'
                            ? 'Common'
                            : raritaInput === 'uncommon'
                              ? 'Uncommon'
                              : raritaInput === 'rare'
                                ? 'Rare'
                                : raritaInput === 'mythic'
                                  ? 'Mythic Rare'
                                  : 'Tutte'}
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
                      </button>
                      {isRarityOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsRarityOpen(false)} />
                          <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                            {[
                              { v: '', l: 'Tutte' },
                              { v: 'common', l: 'Common' },
                              { v: 'uncommon', l: 'Uncommon' },
                              { v: 'rare', l: 'Rare' },
                              { v: 'mythic', l: 'Mythic Rare' },
                            ].map((opt) => (
                              <button
                                key={opt.v}
                                type="button"
                                className={cn(
                                  'w-full px-3 py-2 text-left text-sm hover:bg-orange-50',
                                  raritaInput === opt.v && 'bg-[#FF8800]/15 font-semibold'
                                )}
                                onClick={() => {
                                  setRaritaInput(opt.v);
                                  setIsRarityOpen(false);
                                }}
                              >
                                {opt.l}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </label>
                  )}

                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                      {t('search.thName')}
                    </span>
                    <div className="relative">
                      <input
                        type="text"
                        value={nomeInput}
                        onChange={(e) => setNomeInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCerca()}
                        placeholder={t('search.thName')}
                        className={fieldClass}
                      />
                      {nomeInput && (
                        <button
                          type="button"
                          onClick={() => setNomeInput('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
                          aria-label="Cancella nome"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </label>

                  <button
                    type="button"
                    onClick={handleCerca}
                    className="mt-1 flex min-h-[40px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#FF8800] px-4 text-sm font-bold text-white transition-colors hover:bg-orange-600"
                  >
                    <Search className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                    {t('search.searchBtn')}
                  </button>
                </div>
              </div>
            </aside>

            {/* Contenuto principale */}
            <div className="min-w-0 flex-1">
              {!loading && !error && (
                <SearchResultsToolbar
                  className="mb-4"
                  total={total}
                  sortParam={sortParam}
                  sortOptions={sortOptions}
                  viewMode={viewMode}
                  onSortChange={(value) => router.push(buildUrl({ sort: value, page: '1' }))}
                  onViewModeChange={setViewMode}
                  t={t}
                  advancedHint={false}
                />
              )}

              {(loading || error) && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
                  <p className="text-sm text-gray-700">
                    <strong>{total}</strong> {t('search.results')}
                  </p>
                </div>
              )}

              <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm search-results-card">
                {error && (
                  <div className="p-6 text-center text-red-600 bg-red-50">{error}</div>
                )}
                {loading && (
                  <div className="p-12 text-center text-gray-500">{t('search.loading')}</div>
                )}
                {!loading && !error && hits.length === 0 && (
                  <div className="p-12 text-center text-gray-500">{t('search.noResults')}</div>
                )}

                {!loading && !error && hits.length > 0 && viewMode === 'list' && (
                  <SearchResultsTable
                    hits={hits}
                    selectedLang={selectedLang}
                    gameSlug={mappingGameSlug}
                    t={t}
                    editionVariant="icon"
                    showCardDetails={showCardDetails}
                    formatPrice={(hit) => formatEuro((hit as SinglesHit).market_price)}
                  />
                )}

                {!loading && !error && hits.length > 0 && viewMode === 'grid' && (
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
                                sizes="(max-width:640px) 50vw, 25vw"
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
          </div>
        </div>
      </section>
    </RarityLegendProvider>
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
