'use client';

/**
 * Homepage scambi — replica struttura e stile di AsteHubPage ma con dati mockati,
 * senza timer/prezzi e senza sezione "In evidenza / Terminano presto".
 */

import { useEffect, useMemo, useState } from 'react';
import { Search, ChevronDown, ChevronUp, X, ArrowLeftRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';
import {
  AuctionViewToggle,
  ScambiResultsGrid,
  ScambiListTable,
} from '@/components/feature/scambi/scambi-browse-shared';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';
import { MOCK_SCAMBI } from '@/components/feature/scambi/mock-scambi';
import type { ScambioGame } from '@/components/feature/scambi/scambi-types';
import { ScambiNav } from '@/components/feature/scambi/ScambiNav';
import { getStoredAsteViewMode, setStoredAsteViewMode, type AsteViewMode } from '@/lib/auction/aste-view-storage';

type SortMode = 'new' | 'alpha';

const VIEW_STORAGE_KEY = 'scambi-hub';

export function ScambiHubPage() {
  const { t } = useTranslation();

  const breadcrumbItems: AppBreadcrumbItem[] = [
    { href: '/', label: t('auctions.breadcrumbHome') ?? 'Home', isCurrent: false },
    { label: 'Scambi', isCurrent: true },
  ];

  const [viewMode, setViewMode] = useState<AsteViewMode>('grid');
  const [sort, setSort] = useState<SortMode>('new');
  const [q, setQ] = useState('');

  const [filterGame, setFilterGame] = useState<'all' | ScambioGame>('all');
  const [filterCondition, setFilterCondition] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Sticky bottom bar states
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [bottomBarExpanded, setBottomBarExpanded] = useState(false);

  useEffect(() => {
    setViewMode(getStoredAsteViewMode(VIEW_STORAGE_KEY));
  }, []);

  useEffect(() => {
    setStoredAsteViewMode(VIEW_STORAGE_KEY, viewMode);
  }, [viewMode]);

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

    let rows = MOCK_SCAMBI.filter((s) => {
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
  }, [q, sort, filterGame, filterCondition]);

  return (
    <div className="overflow-x-clip bg-white">
      <ScambiNav />
      <section className="pb-28 pt-6 md:pb-16">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {/* Header interno pagina */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tight text-[#1D3160] sm:text-4xl">
                  Scambi
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Trova carte collezionabili da scambiare con la community.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF7300] to-[#FF8800] px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-[#FF7300]/25 transition-all hover:brightness-110 active:scale-95"
              >
                <ArrowLeftRight className="h-4 w-4" />
                Proponi scambio
              </button>
            </div>

            <AppBreadcrumb
              items={breadcrumbItems}
              ariaLabel="Breadcrumb"
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
                      placeholder="Cerca tra gli scambi..."
                      className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none"
                      aria-label="Cerca tra gli scambi"
                    />
                    {q && (
                      <button
                        type="button"
                        onClick={() => setQ('')}
                        className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                        aria-label="Cancella ricerca"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn-orange-glow shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs sm:px-4 sm:text-sm"
                  >
                    Cerca
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
                  aria-label={showFilters ? 'Nascondi filtri' : 'Mostra filtri'}
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
                    <span className="text-xs font-semibold uppercase text-gray-600">Gioco</span>
                    <select
                      value={filterGame}
                      onChange={(e) => setFilterGame(e.target.value as 'all' | ScambioGame)}
                      className="w-full sm:min-w-[140px] sm:w-auto rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 [color-scheme:light]"
                    >
                      <option value="all">Tutti</option>
                      <option value="mtg">MTG</option>
                      <option value="lorcana">Lorcana</option>
                      <option value="pokemon">Pokémon</option>
                      <option value="op">One Piece</option>
                      <option value="ygo">Yu-Gi-Oh!</option>
                      <option value="other">Altro</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 w-full sm:w-auto">
                    <span className="text-xs font-semibold uppercase text-gray-600">Condizione</span>
                    <input
                      type="text"
                      placeholder="Es. Near Mint"
                      value={filterCondition}
                      onChange={(e) => setFilterCondition(e.target.value)}
                      className="w-full sm:w-[160px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                  </label>

                  {/* Spacer */}
                  <div className="hidden lg:block flex-1" />

                  {/* Ordina per + vista */}
                  <label className="flex items-center gap-2 text-sm text-gray-600 w-full sm:w-auto">
                    <span className="whitespace-nowrap text-xs font-semibold uppercase text-gray-600">Ordina per</span>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortMode)}
                      className="min-w-[11rem] rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium bg-white text-gray-900 [color-scheme:light] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/40"
                    >
                      <option value="new">Più recenti</option>
                      <option value="alpha">Alfabetico</option>
                    </select>
                  </label>
                  <AuctionViewToggle
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    listLabel="Lista"
                    gridLabel="Griglia"
                  />
                </div>
              </div>
            </div>

            {/* Risultati scambi */}
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">
                {filtered.length} {filtered.length === 1 ? 'risultato' : 'risultati'}
              </p>
            </div>
            <div className="overflow-hidden border border-gray-300 bg-gray-50">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-gray-500 sm:p-16">Nessuno scambio trovato</div>
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
                    placeholder="Cerca tra gli scambi..."
                    className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none"
                    aria-label="Cerca tra gli scambi"
                  />
                  {q && (
                    <button
                      type="button"
                      onClick={() => setQ('')}
                      className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                      aria-label="Cancella ricerca"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="shrink-0 whitespace-nowrap rounded-full bg-[#FF7300] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#e86800] sm:px-4 sm:text-sm"
                >
                  Cerca
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
                aria-label={bottomBarExpanded ? 'Comprimi filtri' : 'Espandi filtri'}
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
                    <span className="text-xs font-semibold uppercase text-gray-600">Gioco</span>
                    <select
                      value={filterGame}
                      onChange={(e) => setFilterGame(e.target.value as 'all' | ScambioGame)}
                      className="w-full sm:min-w-[140px] sm:w-auto rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 [color-scheme:light]"
                    >
                      <option value="all">Tutti</option>
                      <option value="mtg">MTG</option>
                      <option value="lorcana">Lorcana</option>
                      <option value="pokemon">Pokémon</option>
                      <option value="op">One Piece</option>
                      <option value="ygo">Yu-Gi-Oh!</option>
                      <option value="other">Altro</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 w-full sm:w-auto">
                    <span className="text-xs font-semibold uppercase text-gray-600">Condizione</span>
                    <input
                      type="text"
                      placeholder="Es. Near Mint"
                      value={filterCondition}
                      onChange={(e) => setFilterCondition(e.target.value)}
                      className="w-full sm:w-[160px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    />
                  </label>

                  {/* Spacer */}
                  <div className="hidden lg:block flex-1" />

                  {/* Sort */}
                  <label className="flex items-center gap-2 text-sm text-gray-600 w-full sm:w-auto">
                    <span className="whitespace-nowrap text-xs font-semibold uppercase text-gray-600">Ordina per</span>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortMode)}
                      className="min-w-[11rem] rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium bg-white text-gray-900 [color-scheme:light] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/40"
                    >
                      <option value="new">Più recenti</option>
                      <option value="alpha">Alfabetico</option>
                    </select>
                  </label>

                  {/* View Toggle */}
                  <AuctionViewToggle
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    listLabel="Lista"
                    gridLabel="Griglia"
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
