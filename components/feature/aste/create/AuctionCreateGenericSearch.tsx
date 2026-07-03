'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Camera, Loader2, Search } from 'lucide-react';

// Lazy: lo scanner carica onnxruntime-web (~1.1MB) solo quando l'utente lo apre.
const ScannerModal = dynamic(
  () => import('@/components/feature/scanner/ScannerModal').then((m) => m.ScannerModal),
  { ssr: false, loading: () => null }
);
import type { SearchHit } from '@/app/api/search/route';
import { useInfiniteSearchCards } from '@/lib/hooks/use-search';
import {
  auctionGameToSearchParam,
  type AuctionCreateCardSelection,
} from '@/lib/auction/auction-create-draft';
import type { AuctionGame } from '@/components/feature/aste/mock-auctions';
import { getCardImageUrl } from '@/lib/assets';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';
import { CardImageCameraPeek } from '@/components/ui/CardImageCameraPeek';
import { SetIconBadge } from '@/components/ui/SetIconBadge';
import { AuctionViewToggle } from '@/components/feature/aste/auctions-browse-shared';
import { AuctionCardGridTile } from './AuctionCardGridTile';

function hitToSelection(hit: SearchHit): AuctionCreateCardSelection {
  return {
    id: hit.id,
    title: hit.name,
    image: hit.image ?? '',
    setName: hit.set_name,
    gameSlug: hit.game_slug,
    availableLanguages: hit.available_languages?.length ? hit.available_languages : undefined,
  };
}


export function AuctionCreateGenericSearch({
  selectedId,
  selectedTitle,
  onSelect,
  onClearSelection,
}: {
  selectedId: string | null;
  selectedTitle?: string | null;
  onSelect: (selection: AuctionCreateCardSelection) => void;
  onClearSelection?: () => void;
}) {
  const { t } = useTranslation();
  // Catalogo attivo: per ora solo Magic (chip giochi rimossi su richiesta).
  const [searchGame] = useState<AuctionGame>('mtg');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query.trim()), 350);
    return () => window.clearTimeout(id);
  }, [query]);

  const apiGame = useMemo(() => auctionGameToSearchParam(searchGame), [searchGame]);

  // Stessa logica della barra di ricerca principale: ranking di rilevanza
  // Meilisearch (sort: relevance) e paginazione "carica altri" fino a
  // esaurire i risultati, invece del cap fisso a 12.
  const {
    data: searchData,
    isLoading: loadingSearch,
    error: searchErr,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteSearchCards(
    { q: debounced || undefined, game: apiGame || undefined, limit: 20, sort: 'relevance' },
    { enabled: Boolean(debounced) },
  );
  const hits = useMemo(
    () => searchData?.pages.flatMap((p) => p.hits) ?? [],
    [searchData],
  );
  const searchError = searchErr
    ? (searchErr instanceof Error ? searchErr.message : t('auctions.createSearchError'))
    : null;

  const handleSelect = useCallback(
    (sel: AuctionCreateCardSelection) => {
      onSelect(sel);
      setQuery('');
    },
    [onSelect]
  );

  return (
    <div className="space-y-4">
      {selectedId && selectedTitle ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-[#FF7300] bg-orange-50/60 px-4 py-3">
          <p className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-[#FF7300]">
              {t('auctions.createCardSelected')}
            </span>
            <span className="mt-0.5 block truncate text-sm font-semibold text-[#1D3160]">{selectedTitle}</span>
          </p>
          {onClearSelection ? (
            <button
              type="button"
              onClick={onClearSelection}
              className="shrink-0 rounded-lg border border-[#1D3160]/20 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#1D3160] transition hover:border-[#1D3160]/40"
            >
              {t('auctions.createChangeCardSelection')}
            </button>
          ) : null}
        </div>
      ) : (
      <>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('auctions.createGenericSearchPlaceholder')}
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-10 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/20"
          autoComplete="off"
          aria-label={t('auctions.createGenericSearchPlaceholder')}
        />
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[#FF7300]/10 hover:text-[#FF7300]"
          aria-label="Scansiona con fotocamera"
          title="Scansiona con fotocamera"
        >
          <Camera className="h-4 w-4" />
        </button>
      </div>

      {loadingSearch && debounced && (
        <p className="flex items-center gap-2 text-sm text-gray-500" role="status">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {t('auctions.createSearchLoading')}
        </p>
      )}
      {searchError && debounced && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {searchError}
        </p>
      )}

      {!loadingSearch && debounced && !searchError && hits.length === 0 && (
        <p className="text-sm text-gray-500">{t('auctions.createSearchNoResults')}</p>
      )}

      {debounced && !searchError && hits.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              {t('search.results')}
            </span>
            <AuctionViewToggle
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              listLabel={t('auctions.viewList')}
              gridLabel={t('auctions.viewGrid')}
            />
          </div>

          {viewMode === 'list' ? (
            <ul className="scrollbar-hide max-h-[min(360px,55vh)] divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
              {hits.map((hit, index) => {
                const imgUrl = getCardImageUrl(hit.image ?? null);
                const sel = hitToSelection(hit);
                const active = selectedId === hit.id;
                const isTopRelevance = index === 0;
                const showTopPulse = isTopRelevance && !active;
                return (
                  <li key={hit.id}>
                    <div
                      className={cn(
                        'flex w-full items-stretch gap-3 px-3 py-3',
                        showTopPulse && 'auction-search-top-hit',
                        active ? 'bg-orange-50/90 ring-2 ring-inset ring-[#FF7300]' : 'hover:bg-gray-50'
                      )}
                    >
                      {/* Trigger anteprima + logo set: identici alla barra di ricerca globale */}
                      <div className="flex shrink-0 items-center gap-2 self-center">
                        <CardImageCameraPeek
                          imageUrl={imgUrl}
                          name={hit.name}
                          variant="thumb"
                          previewSide="left"
                          closeModalLabelKey="auctions.createImagePreviewClose"
                        />
                        <SetIconBadge
                          setIconUri={hit.set_icon_uri}
                          setCode={hit.set_code}
                          setName={hit.set_name}
                          gameSlug={hit.game_slug}
                          imageClassName="h-8 w-8 object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelect(sel)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#1D3160]">{hit.name}</p>
                          <p className="truncate text-xs text-gray-500">{hit.set_name}</p>
                        </div>
                        {active && (
                          <span className="shrink-0 rounded-full bg-[#FF7300] px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                            {t('auctions.createCardSelected')}
                          </span>
                        )}
                      </button>
                    </div>
                  </li>
                );
              })}
              {hasNextPage && (
                <li>
                  <button
                    type="button"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="flex w-full items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-[#1D3160] transition hover:bg-gray-50 disabled:opacity-60"
                  >
                    {isFetchingNextPage && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                    {t('auctions.createSearchLoadMore')}
                  </button>
                </li>
              )}
            </ul>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 max-h-[min(360px,55vh)] overflow-y-auto p-1 scrollbar-hide">
                {hits.map((hit) => {
                  const imgUrl = getCardImageUrl(hit.image ?? null);
                  const sel = hitToSelection(hit);
                  const active = selectedId === hit.id;
                  return (
                    <AuctionCardGridTile
                      key={hit.id}
                      imageUrl={imgUrl}
                      name={hit.name}
                      setName={hit.set_name}
                      active={active}
                      activeLabel={t('auctions.createCardSelected')}
                      onSelect={() => handleSelect(sel)}
                      ariaLabel={t('auctions.createCollectionSelectByImage', { name: hit.name })}
                      meta={
                        <span className="rounded bg-white/90 p-0.5">
                          <SetIconBadge
                            setIconUri={hit.set_icon_uri}
                            setCode={hit.set_code}
                            setName={hit.set_name}
                            gameSlug={hit.game_slug}
                            imageClassName="h-4 w-4 object-contain"
                          />
                        </span>
                      }
                    />
                  );
                })}
              </div>
              {hasNextPage && (
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-[#1D3160] transition hover:bg-gray-50 disabled:opacity-60 shadow-sm"
                >
                  {isFetchingNextPage && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                  {t('auctions.createSearchLoadMore')}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      </>
      )}

      {scannerOpen && (
        <ScannerModal
          onConfirm={(scanQuery) => {
            setQuery(scanQuery);
            setScannerOpen(false);
          }}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  );
}
