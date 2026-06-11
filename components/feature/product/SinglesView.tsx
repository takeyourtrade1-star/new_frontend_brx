'use client';

/**
 * Pagine categoria prodotti (/products/singles, boosters, …):
 * filtri in sidebar, titolo minimale, risultati con logo set come /search.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { isSellFlow, getProductDetailHref } from '@/lib/sell-flow/sell-flow';

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

const fieldClassLarge =
  'min-h-[48px] w-full rounded-[16px] border-2 border-gray-200 bg-[#f2f2f7] px-4 py-3 text-base text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5AC8FA]/30 focus:border-[#5AC8FA]/50';

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

/* ── Animated typewriter placeholder (copia semplificata da GlobalSearchBar) ── */
const TYPE_SPEED = 60;
const DELETE_SPEED = 35;
const PAUSE_AFTER_TYPE = 2200;
const PAUSE_AFTER_DELETE = 400;

function getPlaceholderWords(categorySlug: string): string[] {
  switch (categorySlug) {
    case 'singles':
      return [
        'cerca una carta...',
        'Black Lotus...',
        'Mox Pearl...',
        'Ancestral Recall...',
        'Time Walk...',
        'Tarmogoyf...',
        'Snapcaster Mage...',
      ];
    case 'boosters':
      return [
        'cerca un booster...',
        'Booster Box...',
        'Draft Booster...',
        'Set Booster...',
        'Collector Booster...',
        'Bundle...',
      ];
    case 'sealed':
      return [
        'cerca un prodotto sigillato...',
        'Commander Deck...',
        'Starter Deck...',
        'Preconstructed...',
        'Fat Pack...',
        'Gift Bundle...',
      ];
    case 'lots':
      return [
        'cerca un lotto...',
        'Lot of cards...',
        'Collection...',
        'Bulk...',
        'Playset...',
        'Bundle cards...',
      ];
    case 'accessories':
      return [
        'cerca un accessorio...',
        'Sleeves...',
        'Deck box...',
        'Playmat...',
        'Binder...',
        'Toploader...',
      ];
    default:
      return [
        'cerca un prodotto...',
        'Black Lotus...',
        'Booster Box...',
        'Mox Pearl...',
      ];
  }
}

function AnimatedSearchPlaceholder({ visible, categorySlug }: { visible: boolean; categorySlug: string }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const words = useMemo(() => getPlaceholderWords(categorySlug), [categorySlug]);

  const tick = useCallback(() => {
    const currentWord = words[wordIndex];

    if (!isDeleting) {
      const nextText = currentWord.slice(0, displayText.length + 1);
      setDisplayText(nextText);

      if (nextText === currentWord) {
        timeoutRef.current = setTimeout(() => setIsDeleting(true), PAUSE_AFTER_TYPE);
        return;
      }
      timeoutRef.current = setTimeout(tick, TYPE_SPEED);
    } else {
      const nextText = currentWord.slice(0, displayText.length - 1);
      setDisplayText(nextText);

      if (nextText === '') {
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % words.length);
        timeoutRef.current = setTimeout(tick, PAUSE_AFTER_DELETE);
        return;
      }
      timeoutRef.current = setTimeout(tick, DELETE_SPEED);
    }
  }, [wordIndex, displayText, isDeleting, words]);

  useEffect(() => {
    if (!visible) return;
    timeoutRef.current = setTimeout(tick, TYPE_SPEED);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [tick, visible]);

  useEffect(() => {
    if (!visible) {
      setDisplayText('');
      setIsDeleting(false);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center whitespace-nowrap overflow-hidden px-6 py-3 text-lg select-none"
      aria-hidden="true"
    >
      <span className="text-[#FF8800]">{displayText}</span>
      <span className="inline-block w-[2px] h-[1.1em] ml-[1px] align-middle animate-blink-caret bg-[#FF8800]/80" />
    </div>
  );
}

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
  const sellFlow = isSellFlow(searchParams);
  const productHrefBuilder = useCallback(
    (id: string) => (sellFlow ? getProductDetailHref(id, { sellFlow: true }) : `/products/${id}`),
    [sellFlow],
  );
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
  const [isSetDropdownOpen, setIsSetDropdownOpen] = useState(false);
  const [data, setData] = useState<SearchApiResponse | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(!sellFlow);
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
    if (!sellFlow || hasSearched) {
      fetchResults();
    }
  }, [fetchResults, sellFlow, hasSearched]);

  const total = data?.total ?? 0;
  const rawHits = (data?.hits ?? []) as SinglesHit[];
  const currentPage = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;

  const availableSets = useMemo(() => {
    const names = new Set<string>();
    rawHits.forEach((hit) => {
      if (hit.set_name) names.add(hit.set_name);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [rawHits]);

  // Ordina hits: match esatti prima, poi parziali
  const { hits, exactMatchIds } = useMemo(() => {
    const searchName = nomeInput.trim().toLowerCase();
    const searchSet = edizioneInput.trim().toLowerCase();
    const ids = new Set<string>();
    
    if (!searchName && !searchSet) {
      return { hits: rawHits, exactMatchIds: ids };
    }

    const sorted = [...rawHits].sort((a, b) => {
      const aName = (a.name ?? '').toLowerCase();
      const bName = (b.name ?? '').toLowerCase();
      const aSet = (a.set_name ?? '').toLowerCase();
      const bSet = (b.set_name ?? '').toLowerCase();
      
      const aNameMatch = searchName ? aName.includes(searchName) : true;
      const bNameMatch = searchName ? bName.includes(searchName) : true;
      const aSetMatch = searchSet ? aSet.includes(searchSet) : true;
      const bSetMatch = searchSet ? bSet.includes(searchSet) : true;
      
      const aExact = aNameMatch && aSetMatch;
      const bExact = bNameMatch && bSetMatch;
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });

    sorted.forEach((hit) => {
      const name = (hit.name ?? '').toLowerCase();
      const set = (hit.set_name ?? '').toLowerCase();
      const nameMatch = searchName ? name.includes(searchName) : true;
      const setMatch = searchSet ? set.includes(searchSet) : true;
      if (nameMatch && setMatch) {
        ids.add(hit.id);
      }
    });

    return { hits: sorted, exactMatchIds: ids };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.hits, nomeInput, edizioneInput]);

  const handleCerca = () => {
    if (sellFlow && !hasSearched) {
      setHasSearched(true);
    }
    router.push(buildUrl({ q: nomeInput.trim(), set: edizioneInput.trim(), page: '1' }));
  };

  const formatEuro = (n: number | undefined) =>
    n != null ? formatEuroNoSpace(n, 'it-IT') : '–';

  const pageTitle = useMemo(() => {
    const key = `products.category.${categorySlug}` as MessageKey;
    const translated = t(key);
    return translated === key ? title.toUpperCase() : translated.toUpperCase();
  }, [categorySlug, title, t]);

  return (
    <RarityLegendProvider>
      <section className="min-h-screen pb-12 bg-[#F0F0F0]">
        {(!sellFlow || hasSearched) && (
          <div className="container-content px-4 sm:px-6 pt-6 pb-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-gray-900">
              {pageTitle}
            </h1>
          </div>
        )}

        <div className="container-content px-4 sm:px-6 py-4">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {/* Sidebar filtri */}
            <aside className={cn(
              'w-full shrink-0 transition-all duration-300',
              sellFlow && !hasSearched
                ? 'lg:w-full xl:w-full flex items-center justify-center lg:min-h-[60vh]'
                : 'lg:w-56 xl:w-64'
            )}>
              <div className={cn(
                'transition-all duration-300',
                sellFlow && !hasSearched
                  ? 'p-8 lg:p-12 flex flex-col justify-center items-center w-full max-w-2xl'
                  : 'rounded-xl border border-gray-200 bg-white shadow-sm p-4 sticky top-4'
              )}>
                {(!sellFlow || hasSearched) && (
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                    {t('search.filtersSheetTitle')}
                  </p>
                )}
                <div className={cn(
                  'flex flex-col gap-3 w-full',
                  sellFlow && !hasSearched ? 'max-w-2xl' : ''
                )}>
                  {/* Ricerca rapida (solo in flusso vendi) */}
                  {sellFlow && (
                    <div className={cn(
                      'flex flex-col gap-4',
                      sellFlow && !hasSearched ? 'w-full items-center' : ''
                    )}>
                      {sellFlow && !hasSearched && (
                        <h2 className="text-4xl lg:text-5xl font-black text-[#FF8800] tracking-tight uppercase text-center mb-2">
                          {pageTitle}
                        </h2>
                      )}
                      
                      <div className={cn(
                        'flex items-center gap-3',
                        sellFlow && !hasSearched ? 'w-full max-w-2xl mx-auto' : ''
                      )}>
                        <div className="relative flex-1">
                          <AnimatedSearchPlaceholder visible={sellFlow && !hasSearched && !nomeInput} categorySlug={categorySlug} />
                          <input
                            type="text"
                            value={nomeInput}
                            onChange={(e) => setNomeInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCerca()}
                            placeholder={sellFlow && !hasSearched ? '' : t('search.quickSearchPlaceholder')}
                            className={sellFlow && !hasSearched 
                              ? 'min-h-[56px] w-full rounded-full border-2 border-[#FF8800] bg-white px-6 py-3 text-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF8800]/30 shadow-sm'
                              : fieldClass
                            }
                          />
                          {nomeInput && (
                            <button
                              type="button"
                              onClick={() => setNomeInput('')}
                              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
                              aria-label={t('search.clearQuickSearch')}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        
                        {sellFlow && !hasSearched && (
                          <button
                            type="button"
                            onClick={handleCerca}
                            className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-full bg-[#FF8800] text-white transition-all hover:bg-orange-600 hover:shadow-md active:scale-95"
                            aria-label={t('search.searchBtn')}
                          >
                            <Search className="h-5 w-5" strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                      
                      {sellFlow && !hasSearched && (
                        <p className="text-center text-sm text-gray-500 mt-2">
                          {t('search.sellSearchHint')}
                        </p>
                      )}
                    </div>
                  )}

                  {(!sellFlow || hasSearched) && (
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                        {t('search.filterEdition')}
                      </span>
                      <div className="relative">
                        <input
                          type="text"
                          value={edizioneInput}
                          onChange={(e) => {
                            setEdizioneInput(e.target.value);
                            setIsSetDropdownOpen(true);
                          }}
                          onFocus={() => { if (availableSets.length > 0) setIsSetDropdownOpen(true); }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { setIsSetDropdownOpen(false); handleCerca(); }
                            if (e.key === 'Escape') setIsSetDropdownOpen(false);
                          }}
                          placeholder={t('search.filterEdition')}
                          className={cn(fieldClass, edizioneInput ? 'pr-7' : '')}
                        />
                        {edizioneInput && (
                          <button
                            type="button"
                            onClick={() => { setEdizioneInput(''); setIsSetDropdownOpen(false); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
                            aria-label={t('search.clearEdition')}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {isSetDropdownOpen && availableSets.length > 0 && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsSetDropdownOpen(false)} />
                            <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 max-h-52 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                              {availableSets
                                .filter((s) => !edizioneInput.trim() || s.toLowerCase().includes(edizioneInput.toLowerCase()))
                                .map((set) => (
                                  <button
                                    key={set}
                                    type="button"
                                    className={cn(
                                      'w-full px-3 py-2 text-left text-sm text-gray-900 hover:bg-orange-50 transition-colors',
                                      edizioneInput === set && 'bg-[#FF8800]/15 font-semibold'
                                    )}
                                    onClick={() => {
                                      setEdizioneInput(set);
                                      setIsSetDropdownOpen(false);
                                      router.push(buildUrl({ q: nomeInput.trim(), set, page: '1' }));
                                    }}
                                  >
                                    {set}
                                  </button>
                                ))}
                              {availableSets.filter((s) => !edizioneInput.trim() || s.toLowerCase().includes(edizioneInput.toLowerCase())).length === 0 && (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  {t('search.noResults')}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </label>
                  )}


                  {categorySlug === 'singles' && !sellFlow && (
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

                  {!sellFlow && (
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
                            aria-label={t('search.clearName')}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </label>
                  )}

                  {!(sellFlow && !hasSearched) && (
                    <button
                      type="button"
                      onClick={handleCerca}
                      className="mt-1 flex min-h-[40px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#FF8800] px-4 text-sm font-bold text-white transition-colors hover:bg-orange-600"
                    >
                      <Search className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                      {t('search.searchBtn')}
                    </button>
                  )}
                </div>
              </div>
            </aside>

            {/* Contenuto principale */}
            <div className={cn(
              'min-w-0 flex-1',
              sellFlow && !hasSearched ? 'hidden' : ''
            )}>
              {(!sellFlow || hasSearched) && !loading && !error && (
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

              {(!sellFlow || hasSearched) && (loading || error) && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
                  <p className="text-sm text-gray-700">
                    <strong>{total}</strong> {t('search.results')}
                  </p>
                </div>
              )}

              {(!sellFlow || hasSearched) && (
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
                      buildProductHref={sellFlow ? productHrefBuilder : undefined}
                      exactMatchIds={exactMatchIds}
                    />
                  )}

                  {!loading && !error && hits.length > 0 && viewMode === 'grid' && (
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {hits.map((hit) => {
                        const imgUrl = getCardImageUrl(hit.image ?? null);
                        const { primary, secondary } = getDisplayNames(hit, selectedLang);
                        const isExact = exactMatchIds?.has(hit.id) ?? false;
                        return (
                          <Link
                            key={hit.id}
                            href={productHrefBuilder(hit.id)}
                            className={cn(
                              'group border rounded-lg bg-white p-3 transition-all',
                              isExact
                                ? 'border-[#FF8800] border-2 shadow-md'
                                : 'border-gray-200 hover:border-[#FF8800] hover:shadow-md'
                            )}
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
              )}
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
