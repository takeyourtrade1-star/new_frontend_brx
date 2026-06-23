'use client';

/**
 * Homepage scambi — replica struttura e stile di AsteHubPage ma con dati mockati,
 * senza timer/prezzi e senza sezione "In evidenza / Terminando presto".
 */

import { useEffect, useMemo, useState } from 'react';
import { Search, ChevronDown, ChevronUp, X, Sparkles } from 'lucide-react';
import { ScambiIcon } from '@/components/ui/ScambiIcon';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';
import {
  AuctionViewToggle,
  ScambiResultsGrid,
  ScambiListTable,
} from '@/components/feature/scambi/scambi-browse-shared';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';
import type { ScambioGame, ScambioUI } from '@/components/feature/scambi/scambi-types';
import { ScambiNav } from '@/components/feature/scambi/ScambiNav';
import { getStoredAsteViewMode, setStoredAsteViewMode, type AsteViewMode } from '@/lib/auction/aste-view-storage';
import { fetchScambiCatalog } from '@/lib/scambi/scambi-catalog';

type SortMode = 'new' | 'alpha';

const VIEW_STORAGE_KEY = 'scambi-hub';

export function ScambiHubPage() {
  const { t } = useTranslation();

  const breadcrumbItems: AppBreadcrumbItem[] = [
    { href: '/', label: t('auctions.breadcrumbHome') ?? 'Home', isCurrent: false },
    { label: t('scambi.hubTitle'), isCurrent: true },
  ];

  const [viewMode, setViewMode] = useState<AsteViewMode>('grid');
  const [sort, setSort] = useState<SortMode>('new');
  const [q, setQ] = useState('');

  const [filterGame, setFilterGame] = useState<'all' | ScambioGame>('all');
  const [filterCondition, setFilterCondition] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [scambi, setScambi] = useState<ScambioUI[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Sticky bottom bar states
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [bottomBarExpanded, setBottomBarExpanded] = useState(false);

  const gameOptions = useMemo<
    { value: 'all' | ScambioGame; label: string }[]
  >(
    () => [
      { value: 'all', label: t('common.all') },
      { value: 'mtg', label: t('auctions.gameMtg') },
      { value: 'lorcana', label: t('auctions.gameLorcana') },
      { value: 'pokemon', label: t('auctions.gamePokemon') },
      { value: 'op', label: t('auctions.gameOp') },
      { value: 'ygo', label: t('auctions.gameYgo') },
      { value: 'other', label: t('auctions.gameOther') },
    ],
    [t]
  );

  const sortOptions = useMemo<
    { value: SortMode; label: string }[]
  >(
    () => [
      { value: 'new', label: t('scambi.sortNew') },
      { value: 'alpha', label: t('scambi.sortAlpha') },
    ],
    [t]
  );

  useEffect(() => {
    setViewMode(getStoredAsteViewMode(VIEW_STORAGE_KEY));
  }, []);

  useEffect(() => {
    setStoredAsteViewMode(VIEW_STORAGE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    let cancelled = false;
    setLoadingCatalog(true);
    void fetchScambiCatalog(12).then((rows) => {
      if (!cancelled) {
        setScambi(rows);
        setLoadingCatalog(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Detect scroll to show sticky bar
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const isVisible = scrollY > 300;
      setShowStickyBar(isVisible);
      window.dispatchEvent(new CustomEvent('stickyBarVisibilityChange', { detail: { visible: isVisible } }));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.dispatchEvent(new CustomEvent('stickyBarVisibilityChange', { detail: { visible: false } }));
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const condNeedle = filterCondition.trim().toLowerCase();

    let rows = scambi.filter((s) => {
      if (needle && !s.title.toLowerCase().includes(needle) && !s.seller.toLowerCase().includes(needle)) {
        return false;
      }
      if (filterGame !== 'all' && s.game !== filterGame) return false;
      if (condNeedle && !s.condition.toLowerCase().includes(condNeedle)) return false;
      return true;
    });

    const copy = [...rows];
    if (sort === 'new') {
      copy.sort((a, b) => b.numericId - a.numericId);
    } else if (sort === 'alpha') {
      copy.sort((a, b) => a.title.localeCompare(b.title));
    }
    return copy;
  }, [q, sort, filterGame, filterCondition, scambi]);

  const resultsText = useMemo(
    () =>
      filtered.length === 1
        ? t('scambi.resultOne', { count: filtered.length })
        : t('scambi.resultMany', { count: filtered.length }),
    [filtered.length, t]
  );

  return (
    <div className="overflow-x-clip bg-white">
      <ScambiNav />
      <section className="pb-28 pt-6 md:pb-16">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {/* Header interno pagina */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#1D3160] shadow-sm ring-1 ring-black/[0.04] backdrop-blur-md">
                    <Sparkles className="h-3 w-3 text-[#FF7300]" aria-hidden />
                    {t('scambi.comingSoonBadge')}
                  </span>
                  <span className="text-xs text-gray-500">{t('scambi.comingSoonHint')}</span>
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tight text-[#1D3160] sm:text-4xl">
                  {t('scambi.hubTitle')}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {t('scambi.hubSubtitle')}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF7300] to-[#FF8800] px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-[#FF7300]/25 transition-all hover:brightness-110 active:scale-95"
              >
                <ScambiIcon className="h-4 w-4" />
                {t('productDetail.scambi.propose')}
              </button>
            </div>

            <AppBreadcrumb
              items={breadcrumbItems}
              ariaLabel={t('accountPage.breadcrumbNav')}
              variant="default"
              className="mb-4 w-auto text-sm"
            />

            {/* Sezione filtri unificata */}
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              {/* Riga superiore: ricerca + toggle filtri */}
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                {/* Search bar */}
                <div className="flex w-full min-w-0 items-center overflow-hidden rounded-full bg-gray-100 px-2 py-1.5">
                  <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
                    <Search className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                    <input
                      id="scambi-hub-search"
                      type="search"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder={t('scambi.searchPlaceholder')}
                      className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none"
                      aria-label={t('scambi.searchAria')}
                    />
                    {q && (
                      <button
                        type="button"
                        onClick={() => setQ('')}
                        className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                        aria-label={t('common.clearSearch')}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn-orange-glow shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs sm:px-4 sm:text-sm"
                  >
                    {t('common.search')}
                  </button>
                </div>
                {/* Toggle filtri accanto alla search */}
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    'self-center sm:self-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/50 text-white shadow ring-1 ring-white/10 backdrop-blur-xl backdrop-saturate-150 transition-all hover:scale-105 hover:bg-primary/60 active:scale-95',
                    showFilters && 'bg-primary/70 ring-white/20'
                  )}
                  aria-label={showFilters ? t('common.hideFilters') : t('common.showFilters')}
                >
                  {showFilters ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Filtri espandibili */}
              <div
                className={`overflow-hidden transition-all duration-300 ${showFilters ? 'mt-4 max-h-[75vh] overflow-y-auto pr-1 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <div className="flex flex-wrap items-end gap-3 border-b border-gray-200 pb-4">
                  <label className="flex flex-col gap-1 w-full sm:w-auto">
                    <span className="text-xs font-semibold uppercase text-gray-600">{t('game.label')}</span>
                    <select
                      value={filterGame}
                      onChange={(e) => setFilterGame(e.target.value as 'all' | ScambioGame)}
                      className="w-full sm:min-w-[140px] sm:w-auto rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 [color-scheme:light]"
                    >
                      {gameOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 w-full sm:w-auto">
                    <span className="text-xs font-semibold uppercase text-gray-600">{t('common.condition')}</span>
                    <input
                      type="text"
                      placeholder={t('scambi.conditionPlaceholder')}
                      value={filterCondition}
                      onChange={(e) => setFilterCondition(e.target.value)}
                      className="w-full sm:w-[160px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                  </label>

                  {/* Spacer */}
                  <div className="hidden lg:block flex-1" />

                  {/* Ordina per + vista */}
                  <label className="flex items-center gap-2 text-sm text-gray-600 w-full sm:w-auto">
                    <span className="whitespace-nowrap text-xs font-semibold uppercase text-gray-600">{t('common.sortBy')}</span>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortMode)}
                      className="min-w-[11rem] rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium bg-white text-gray-900 [color-scheme:light] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/40"
                    >
                      {sortOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <AuctionViewToggle
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    listLabel={t('auctions.viewList')}
                    gridLabel={t('auctions.viewGrid')}
                  />
                </div>
              </div>
            </div>

            {/* Risultati scambi */}
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">
                {resultsText}
              </p>
            </div>
            <div className="overflow-hidden border border-gray-300 bg-gray-50">
              {loadingCatalog ? (
                <div className="p-8 text-center text-gray-500 sm:p-16">{t('scambi.loading')}</div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center text-gray-500 sm:p-16">{t('scambi.noResults')}</div>
              ) : viewMode === 'grid' ? (
                <ScambiResultsGrid scambi={filtered} />
              ) : (
                <div className="overflow-x-auto">
                  <ScambiListTable scambi={filtered} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Bottom Bar - Search + Expandable Filters */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 z-40 overflow-x-clip border-t border-gray-200 bg-white/95 backdrop-blur-md animate-slide-up-bounce">
          <div className="px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
            <div className="flex min-w-0 items-center gap-2">
              {/* Search bar pillola */}
              <div className="flex min-w-0 flex-1 items-center overflow-hidden rounded-full bg-gray-100 px-2 py-1.5">
                <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
                  <Search className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                  <input
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t('scambi.searchPlaceholder')}
                    className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none"
                    aria-label={t('scambi.searchAria')}
                  />
                  {q && (
                    <button
                      type="button"
                      onClick={() => setQ('')}
                      className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                      aria-label={t('common.clearSearch')}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="shrink-0 whitespace-nowrap rounded-full bg-[#FF7300] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#e86800] sm:px-4 sm:text-sm"
                >
                  {t('common.search')}
                </button>
              </div>
              {/* Toggle filtri */}
              <button
                type="button"
                onClick={() => setBottomBarExpanded(!bottomBarExpanded)}
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/50 text-white shadow ring-1 ring-white/10 backdrop-blur-xl backdrop-saturate-150 transition-all hover:scale-105 hover:bg-primary/60 active:scale-95',
                  bottomBarExpanded && 'bg-primary/70 ring-white/20'
                )}
                aria-label={bottomBarExpanded ? t('common.collapseFilters') : t('common.expandFilters')}
              >
                {bottomBarExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Filtri espandibili */}
            {bottomBarExpanded && (
              <div className="mt-3 overflow-hidden transition-all duration-300">
                <div className="flex flex-wrap items-end gap-3 border-b border-gray-200 pb-3">
                  <label className="flex flex-col gap-1 w-full sm:w-auto">
                    <span className="text-xs font-semibold uppercase text-gray-600">{t('game.label')}</span>
                    <select
                      value={filterGame}
                      onChange={(e) => setFilterGame(e.target.value as 'all' | ScambioGame)}
                      className="w-full sm:min-w-[140px] sm:w-auto rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 [color-scheme:light]"
                    >
                      {gameOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 w-full sm:w-auto">
                    <span className="text-xs font-semibold uppercase text-gray-600">{t('common.condition')}</span>
                    <input
                      type="text"
                      placeholder={t('scambi.conditionPlaceholder')}
                      value={filterCondition}
                      onChange={(e) => setFilterCondition(e.target.value)}
                      className="w-full sm:w-[160px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                  </label>

                  {/* Spacer */}
                  <div className="hidden lg:block flex-1" />

                  {/* Sort */}
                  <label className="flex items-center gap-2 text-sm text-gray-600 w-full sm:w-auto">
                    <span className="whitespace-nowrap text-xs font-semibold uppercase text-gray-600">{t('common.sortBy')}</span>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortMode)}
                      className="min-w-[11rem] rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium bg-white text-gray-900 [color-scheme:light] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/40"
                    >
                      {sortOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* View Toggle */}
                  <AuctionViewToggle
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    listLabel={t('auctions.viewList')}
                    gridLabel={t('auctions.viewGrid')}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
