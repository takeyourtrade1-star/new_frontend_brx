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
import { useSearchCards } from '@/lib/hooks/use-search';
import {
  auctionGameToSearchParam,
  type AuctionCreateCardSelection,
} from '@/lib/auction/auction-create-draft';
import type { AuctionGame } from '@/components/feature/aste/mock-auctions';
import { AUCTION_CREATE_GAMES } from '@/lib/auction/auction-create-draft';
import { getCardImageUrl } from '@/lib/assets';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';
import { AuctionCardImagePeek } from '@/components/feature/aste/create/AuctionCardImagePeek';

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

const GENERIC_GAME_OPTIONS = AUCTION_CREATE_GAMES.filter((g) => g.value !== 'other').map((g) => ({
  ...g,
  available: g.value === 'mtg',
}));

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
  const [searchGame, setSearchGame] = useState<AuctionGame>('mtg');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query.trim()), 350);
    return () => window.clearTimeout(id);
  }, [query]);

  const apiGame = useMemo(() => auctionGameToSearchParam(searchGame), [searchGame]);

  // Ricerca via React Query (regola §2) invece di useEffect+fetch+useState.
  const {
    data: searchData,
    isLoading: loadingSearch,
    error: searchErr,
  } = useSearchCards(
    { q: debounced || undefined, game: apiGame || undefined, limit: 12, page: 1 },
    { enabled: Boolean(debounced) },
  );
  const hits = searchData?.hits ?? [];
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
      <p className="text-sm text-gray-500">{t('auctions.createGenericSearchSubtitle')}</p>

      <div className="flex flex-wrap gap-1.5">
        {GENERIC_GAME_OPTIONS.map(({ value, labelKey, available }) =>
          available ? (
            <button
              key={value}
              type="button"
              onClick={() => setSearchGame(value)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors',
                searchGame === value
                  ? 'border-[#FF7300] bg-[#FF7300] text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              )}
            >
              {t(labelKey)}
            </button>
          ) : (
            <span
              key={value}
              className="inline-flex cursor-not-allowed items-center gap-1 rounded-full border border-dashed border-gray-300 bg-gray-100/50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400"
              title={`${t(labelKey)} — ${t('landing.comingSoon')}`}
            >
              {t(labelKey)}
              <span className="text-[10px] font-medium">•</span>
            </span>
          )
        )}
      </div>

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
        <ul className="scrollbar-hide max-h-[min(320px,50vh)] divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
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
                  <AuctionCardImagePeek
                    imageUrl={imgUrl}
                    name={hit.name}
                    thumbClassName="h-14 w-11"
                    sizes="56px"
                  />
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
        </ul>
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
