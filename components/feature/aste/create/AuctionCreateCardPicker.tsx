'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import type { SearchHit } from '@/app/api/search/route';
import { auctionGameToSearchParam, type AuctionCreateCardSelection } from '@/lib/auction/auction-create-draft';
import type { AuctionGame } from '@/components/feature/aste/mock-auctions';
import type { InventoryItemResponse } from '@/lib/api/sync-client';
import { syncClient } from '@/lib/api/sync-client';
import { fetchCardsByBlueprintIds } from '@/lib/meilisearch-cards-by-ids';
import type { CardCatalogHit } from '@/lib/meilisearch-cards-by-ids';
import { getCardImageUrl } from '@/lib/assets';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';
import { AuctionViewToggle } from '@/components/feature/aste/auctions-browse-shared';
import { AuctionCardImagePeek } from '@/components/feature/aste/create/AuctionCardImagePeek';

type SearchApiResponse = {
  hits: SearchHit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type InventoryWithCard = InventoryItemResponse & { card?: CardCatalogHit | null };

function hitToSelection(hit: SearchHit): AuctionCreateCardSelection {
  return {
    id: hit.id,
    title: hit.name,
    image: hit.image ?? '',
    setName: hit.set_name,
    gameSlug: hit.game_slug,
  };
}

function inventoryToSelection(item: InventoryWithCard): AuctionCreateCardSelection | null {
  const card = item.card;
  if (!card) return null;
  const props = item.properties as Record<string, unknown> | undefined;
  const condition = typeof props?.condition === 'string' ? props.condition : '';
  const language =
    typeof props?.mtg_language === 'string'
      ? props.mtg_language
      : typeof props?.language === 'string'
        ? props.language
        : '';
  const priceEur = item.price_cents > 0 ? (item.price_cents / 100).toFixed(2) : '';
  return {
    id: card.id ?? String(item.blueprint_id),
    title: card.name ?? '',
    image: card.image ?? '',
    setName: card.set_name,
    gameSlug: card.game_slug,
    inventoryItemId: item.id,
    blueprintId: item.blueprint_id,
    condition,
    cardLanguage: language,
    startingBidEur: priceEur,
  };
}

/** Solo singole (carte), come in OggettiContent. */
function isSingoleItem(item: InventoryWithCard): boolean {
  const id = item.card?.id;
  const gameSlug = item.card?.game_slug;
  if (typeof id === 'string' && id.startsWith('sealed_')) return false;
  if (gameSlug === 'sealed' || gameSlug === 'sealed_products') return false;
  return true;
}

function normalizeForSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Mc}/gu, '')
    .replace(/\p{Mn}/gu, '');
}

function matchCollectionQuery(item: InventoryWithCard, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  const qNorm = normalizeForSearch(q);
  const card = item.card;
  const blob = [
    card?.name ?? '',
    card?.set_name ?? '',
    card?.collector_number ?? '',
    String(item.blueprint_id),
  ].join(' ');
  const blobNorm = normalizeForSearch(blob);
  const parts = qNorm.split(/\s+/).filter(Boolean);
  return parts.every((part) => blobNorm.includes(part));
}

/** Solo Magic è ricercabile in catalogo; gli altri sono placeholder «in arrivo». */
const CATALOG_GAME_CHIPS: { value: AuctionGame; labelKey: MessageKey; available: boolean }[] = [
  { value: 'mtg', labelKey: 'auctions.gameMtg', available: true },
  { value: 'lorcana', labelKey: 'auctions.gameLorcana', available: false },
  { value: 'pokemon', labelKey: 'auctions.gamePokemon', available: false },
  { value: 'op', labelKey: 'auctions.gameOp', available: false },
  { value: 'ygo', labelKey: 'auctions.gameYgo', available: false },
];

export function AuctionCreateCardPicker({
  selectedId,
  selectedTitle,
  onSelect,
}: {
  selectedId: string | null;
  selectedTitle?: string | null;
  onSelect: (selection: AuctionCreateCardSelection) => void;
}) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore(
    (s) => s.accessToken ?? (typeof window !== 'undefined' ? localStorage.getItem('ebartex_access_token') : null)
  );

  const [searchGame, setSearchGame] = useState<AuctionGame>('mtg');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [collectionQuery, setCollectionQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryWithCard[]>([]);
  const [loadingCollection, setLoadingCollection] = useState(true);
  const [collectionError, setCollectionError] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query.trim()), 350);
    return () => window.clearTimeout(id);
  }, [query]);

  const apiGame = useMemo(() => auctionGameToSearchParam(searchGame), [searchGame]);

  const fetchSearch = useCallback(async () => {
    if (!debounced) {
      setHits([]);
      setSearchError(null);
      setLoadingSearch(false);
      return;
    }
    setLoadingSearch(true);
    setSearchError(null);
    const params = new URLSearchParams();
    params.set('q', debounced);
    params.set('limit', '12');
    params.set('page', '1');
    if (apiGame) params.set('game', apiGame);
    try {
      const res = await fetch(`/api/search?${params.toString()}`);
      const json = (await res.json().catch(() => ({}))) as SearchApiResponse & { error?: string; detail?: string };
      if (!res.ok) {
        const msg =
          (typeof json?.error === 'string' && json.error) ||
          (typeof json?.detail === 'string' && json.detail) ||
          t('auctions.createSearchError');
        throw new Error(msg);
      }
      setHits(Array.isArray(json.hits) ? json.hits : []);
    } catch (e) {
      setHits([]);
      setSearchError(e instanceof Error ? e.message : t('auctions.createSearchError'));
    } finally {
      setLoadingSearch(false);
    }
  }, [debounced, apiGame, t]);

  useEffect(() => {
    void fetchSearch();
  }, [fetchSearch]);

  const loadInventory = useCallback(async () => {
    if (!user?.id || !accessToken) {
      setInventoryItems([]);
      setLoadingCollection(false);
      return;
    }
    setLoadingCollection(true);
    setCollectionError(null);
    try {
      const allItems: InventoryItemResponse[] = [];
      const pageSize = 500;
      let offset = 0;
      let totalFromApi = 0;
      do {
        const res = await syncClient.getInventory(user.id, accessToken, pageSize, offset);
        const items = res.items ?? [];
        totalFromApi = res.total ?? allItems.length + items.length;
        allItems.push(...items);
        offset += items.length;
        if (items.length < pageSize || offset >= totalFromApi) break;
      } while (true);

      const blueprintIds = [...new Set(allItems.map((i) => i.blueprint_id).filter(Boolean))] as number[];
      let blueprintToCard: Record<number, CardCatalogHit> = {};
      if (blueprintIds.length > 0) {
        blueprintToCard = await fetchCardsByBlueprintIds(blueprintIds);
      }

      const merged: InventoryWithCard[] = allItems.map((item) => ({
        ...item,
        card: blueprintToCard[item.blueprint_id],
      }));

      setInventoryItems(merged.filter(isSingoleItem));
    } catch (e) {
      setCollectionError(e instanceof Error ? e.message : t('auctions.createSearchError'));
      setInventoryItems([]);
    } finally {
      setLoadingCollection(false);
    }
  }, [user?.id, accessToken, t]);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const filteredCollection = useMemo(() => {
    return inventoryItems.filter((item) => matchCollectionQuery(item, collectionQuery));
  }, [inventoryItems, collectionQuery]);

  return (
    <div className="space-y-10 overflow-x-hidden">
      <section className="space-y-4">
        <div className="flex items-start gap-3">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1D3160] text-sm font-bold text-white"
            aria-hidden
          >
            1
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#1D3160]">
              {t('auctions.createCatalogSearchTitle')}
            </h2>
            <p className="mt-1 text-sm text-gray-500">{t('auctions.createCatalogSearchSubtitle')}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CATALOG_GAME_CHIPS.map(({ value, labelKey, available }) =>
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
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 bg-gray-100/50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 cursor-not-allowed"
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
            placeholder={t('auctions.createSearchPlaceholder')}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#FF7300] focus:outline-none focus:ring-2 focus:ring-[#FF7300]/20"
            autoComplete="off"
            aria-label={t('auctions.createSearchPlaceholder')}
          />
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
          <ul className="max-h-[min(320px,50vh)] divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
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
                      onClick={() => onSelect(sel)}
                      aria-label={
                        isTopRelevance
                          ? `${hit.name}, ${hit.set_name}. ${t('auctions.createTopSearchResultHint')}`
                          : undefined
                      }
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
      </section>

      <section className="space-y-4 border-t border-gray-200 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF7300] text-sm font-bold text-white"
              aria-hidden
            >
              2
            </span>
            <div className="min-w-0">
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-[#1D3160]">
                {t('auctions.createCollectionTitle')}
              </h2>
              <p className="mt-1 text-sm text-gray-500">{t('auctions.createCollectionSubtitle')}</p>
            </div>
          </div>
          <AuctionViewToggle
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            listLabel={t('auctions.viewList')}
            gridLabel={t('auctions.viewGrid')}
          />
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
          <input
            type="search"
            value={collectionQuery}
            onChange={(e) => setCollectionQuery(e.target.value)}
            placeholder={t('auctions.createCollectionFilterPlaceholder')}
            className="w-full rounded-lg border border-gray-200 bg-gray-50/80 py-2 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#FF7300] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF7300]/20"
            autoComplete="off"
            aria-label={t('auctions.createCollectionFilterPlaceholder')}
          />
        </div>

        {selectedId && selectedTitle && (
          <p className="text-xs font-semibold uppercase tracking-wide text-[#FF7300]">
            {t('auctions.createCardSelected')}: {selectedTitle}
          </p>
        )}

        {loadingCollection && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {t('auctions.createCollectionLoading')}
          </div>
        )}

        {collectionError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {collectionError}
          </p>
        )}

        {!loadingCollection && !user?.id && (
          <p className="text-sm text-gray-500">
            <Link href="/login" className="font-semibold text-[#FF7300] hover:underline">
              {t('auth.login')}
            </Link>
            {' — '}
            {t('auctions.createCollectionLoginHint')}
          </p>
        )}

        {!loadingCollection && user?.id && filteredCollection.length === 0 && (
          <p className="text-sm text-gray-500">{t('auctions.createCollectionEmpty')}</p>
        )}

        {!loadingCollection && filteredCollection.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {filteredCollection.map((row) => {
              const sel = inventoryToSelection(row);
              if (!sel) return null;
              const imgUrl = getCardImageUrl(row.card?.image ?? null);
              const active = selectedId === sel.id;
              const cardName = row.card?.name ?? '—';
              const props = row.properties as Record<string, unknown> | undefined;
              const condition = typeof props?.condition === 'string' ? props.condition : '';
              const language =
                typeof props?.mtg_language === 'string'
                  ? props.mtg_language
                  : typeof props?.language === 'string'
                    ? props.language
                    : '';
              return (
                <div
                  key={row.id}
                  className={cn(
                    'flex flex-col overflow-hidden rounded-xl border bg-white text-left transition-all',
                    active ? 'border-[#FF7300] ring-2 ring-[#FF7300] ring-offset-2' : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <AuctionCardImagePeek
                    imageUrl={imgUrl}
                    name={cardName}
                    className="rounded-t-xl"
                    thumbClassName="relative aspect-[63/88] w-full"
                    sizes="(max-width: 768px) 50vw, 180px"
                  />
                  <button
                    type="button"
                    onClick={() => onSelect(sel)}
                    className="w-full flex flex-col gap-1 p-2 text-left"
                  >
                    <p className="line-clamp-2 text-xs font-semibold text-gray-900">{cardName}</p>
                    <p className="line-clamp-1 text-[10px] text-gray-500">{row.card?.set_name}</p>
                    <div className="flex flex-wrap gap-1 text-[9px] text-gray-600 pt-1">
                      {condition && (<span className="px-1.5 py-0.5 bg-gray-100 rounded">{condition}</span>)}
                      {language && (<span className="px-1.5 py-0.5 bg-gray-100 rounded">{language}</span>)}
                      {row.quantity && (<span className="px-1.5 py-0.5 bg-gray-100 rounded">Qtà: {row.quantity}</span>)}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!loadingCollection && filteredCollection.length > 0 && viewMode === 'list' && (
          <ul className="max-h-[min(360px,55vh)] divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-200 bg-white">
            {filteredCollection.map((row) => {
              const sel = inventoryToSelection(row);
              if (!sel) return null;
              const imgUrl = getCardImageUrl(row.card?.image ?? null);
              const active = selectedId === sel.id;
              const cardName = row.card?.name ?? '—';
              const props = row.properties as Record<string, unknown> | undefined;
              const condition = typeof props?.condition === 'string' ? props.condition : '';
              const language =
                typeof props?.mtg_language === 'string'
                  ? props.mtg_language
                  : typeof props?.language === 'string'
                    ? props.language
                    : '';
              return (
                <li key={row.id}>
                  <div
                    className={cn(
                      'flex w-full items-stretch gap-3 px-3 py-2.5',
                      active ? 'bg-orange-50/90 ring-2 ring-inset ring-[#FF7300]' : 'hover:bg-gray-50'
                    )}
                  >
                    <AuctionCardImagePeek
                      imageUrl={imgUrl}
                      name={cardName}
                      thumbClassName="h-12 w-10"
                      sizes="40px"
                    />
                    <button
                      type="button"
                      onClick={() => onSelect(sel)}
                      className="flex min-w-0 flex-1 flex-col items-start justify-center gap-1 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#1D3160]">{row.card?.name}</p>
                        <p className="truncate text-xs text-gray-500">{row.card?.set_name}</p>
                      </div>
                      <div className="flex flex-wrap gap-1 text-[9px] text-gray-600">
                        {condition && (<span>{condition}</span>)}
                        {language && (<span>·</span>)} 
                        {language && (<span>{language}</span>)}
                        {row.quantity && (<span>·</span>)}
                        {row.quantity && (<span>Qtà: {row.quantity}</span>)}
                      </div>
                    </button>
                    {active && (
                      <span className="btn-orange-glow shrink-0 rounded-full px-2 py-0.5 text-[10px]">
                        {t('auctions.createCardSelected')}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
