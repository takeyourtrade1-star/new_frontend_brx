'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
  Search,
  Tag,
  Trash2,
  X,
} from 'lucide-react';

import type { SearchHit } from '@/app/api/search/route';
import type { ScanCatalogCard, ScanSessionItem } from '@/hooks/scanner/scanner-types';
import { useLocalScanSession } from '@/hooks/scanner/useLocalScanSession';
import { createListing, MarketplaceApiError } from '@/lib/api/marketplace-client';
import { CARD_LANGUAGE_LABEL_BY_CODE } from '@/lib/card-languages';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { useScannerCatalogCandidates } from '@/lib/hooks/use-scanner-catalog-candidates';
import { useSearchCards } from '@/lib/hooks/use-search';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { SELL_SINGLE_CONDITION_OPTIONS } from '@/lib/marketplace/sell-single-conditions';
import { buildScannerListingGroups, parseScannerPrice } from '@/lib/scanner/sale-batch';
import { useAuthStore } from '@/lib/stores/auth-store';
import { cn } from '@/lib/utils';

const REVIEW_LANGUAGE_CODES = ['en', 'it', 'de', 'fr', 'es', 'pt', 'ja', 'ko', 'zh', 'ru'];

function finiteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function searchHitToCatalogCard(hit: SearchHit): ScanCatalogCard {
  const blueprint = finiteNumber(hit.cardtrader_id);
  const availableLanguages = hit.available_languages
    ?.map((language) => language.trim().toLowerCase())
    .filter(Boolean);
  return {
    cardId: hit.id,
    blueprintId: blueprint && Number.isInteger(blueprint) && blueprint > 0 ? blueprint : null,
    name: hit.name,
    setName: hit.set_name,
    setCode: hit.set_code ?? null,
    collectorNumber: hit.collector_number ?? null,
    image: hit.image ?? null,
    availableLanguages: availableLanguages?.length ? availableLanguages : ['en'],
    marketPrice: finiteNumber(hit.market_price),
    foilPrice: finiteNumber(hit.foil_price),
  };
}

function useBlobUrl(blob: Blob | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}

function statusClass(item: ScanSessionItem): string {
  if (item.sale.publishStatus === 'published') return 'bg-sky-400 text-sky-950';
  if (item.sale.publishStatus === 'failed') return 'bg-red-400 text-red-950';
  if (item.status === 'confirmed') return 'bg-emerald-400 text-emerald-950';
  if (item.status === 'needs_review') return 'bg-amber-400 text-black';
  if (item.status === 'rejected') return 'bg-white/10 text-white/45';
  return 'bg-white/10 text-white/70';
}

function officialCardKey(card: ScanCatalogCard): string {
  return `${card.cardId}:${card.blueprintId ?? ''}`;
}

export default function ScannerReviewPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const {
    session,
    hydrated,
    totals,
    removeItem,
    setItemStatus,
    updateItem,
    updateSale,
    selectCatalogCard,
    applySaleDefaults,
    applySuggestedPrices,
    setPublishState,
    resetSession,
  } = useLocalScanSession();
  const [activeIndex, setActiveIndex] = useState(0);
  const [manualQuery, setManualQuery] = useState('');
  const [defaultLanguage, setDefaultLanguage] = useState('en');
  const [defaultCondition, setDefaultCondition] = useState('near_mint');
  const [publishing, setPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState({ done: 0, total: 0 });
  const [notice, setNotice] = useState<string | null>(null);

  const catalogQuery = useScannerCatalogCandidates(session.items, hydrated);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(0, session.items.length - 1)));
  }, [session.items.length]);

  const activeItem = session.items[activeIndex];
  const captureUrl = useBlobUrl(activeItem?.captureBlob);

  useEffect(() => {
    setManualQuery('');
    setNotice(null);
  }, [activeItem?.id]);

  const debouncedManualQuery = useDebounce(manualQuery.trim(), 250);
  const manualSearch = useSearchCards(
    { q: debouncedManualQuery, game: 'mtg', limit: 8, sort: 'relevance' },
    { enabled: debouncedManualQuery.length >= 2 },
  );

  const candidateCards = useMemo(() => {
    if (!activeItem) return [];
    const cards = [
      ...(activeItem.sale.selectedCard ? [activeItem.sale.selectedCard] : []),
      ...(catalogQuery.data?.results[activeItem.id] ?? []),
      ...((manualSearch.data?.hits ?? []).map(searchHitToCatalogCard)),
    ];
    const unique = new Map(cards.map((card) => [officialCardKey(card), card]));
    return [...unique.values()].slice(0, 10);
  }, [activeItem, catalogQuery.data?.results, manualSearch.data?.hits]);

  const listingGroups = useMemo(
    () => buildScannerListingGroups(session.items),
    [session.items],
  );
  const readyCards = listingGroups.reduce((total, group) => total + group.itemIds.length, 0);

  const goToNextPending = () => {
    if (!activeItem) return;
    const nextIndex = session.items.findIndex(
      (item, index) =>
        index > activeIndex &&
        item.status !== 'confirmed' &&
        item.status !== 'rejected' &&
        item.sale.publishStatus !== 'published',
    );
    setActiveIndex(nextIndex >= 0 ? nextIndex : Math.min(activeIndex + 1, session.items.length - 1));
  };

  const confirmActive = () => {
    if (!activeItem?.sale.selectedCard) {
      setNotice(t('scanner.review.selectOfficialCard'));
      return;
    }
    if (parseScannerPrice(activeItem.sale.price) <= 0) {
      setNotice(t('scanner.review.enterPrice'));
      return;
    }
    setItemStatus(activeItem.id, 'confirmed');
    setNotice(null);
    goToNextPending();
  };

  const clearBatch = async () => {
    if (!window.confirm(t('scanner.review.clearConfirm'))) return;
    await resetSession();
  };

  const publishReadyCards = async () => {
    if (!user?.id) {
      setNotice(t('scanner.review.loginRequired'));
      return;
    }
    const groups = buildScannerListingGroups(session.items);
    const physicalCards = groups.reduce((total, group) => total + group.itemIds.length, 0);
    if (groups.length === 0) {
      setNotice(t('scanner.review.nothingReady'));
      return;
    }
    if (!window.confirm(t('scanner.review.publishConfirm', { count: physicalCards }))) return;

    setPublishing(true);
    setNotice(null);
    setPublishProgress({ done: 0, total: groups.length });
    let succeeded = 0;
    let failed = 0;
    for (const group of groups) {
      setPublishState(group.itemIds, 'publishing');
      try {
        const listing = await createListing(group.body);
        setPublishState(group.itemIds, 'published', { listingId: listing.id });
        succeeded += group.itemIds.length;
      } catch (error) {
        const message = error instanceof MarketplaceApiError
          ? error.detail
          : error instanceof Error
            ? error.message
            : t('scanner.review.publishGenericError');
        setPublishState(group.itemIds, 'failed', { error: message });
        failed += group.itemIds.length;
      } finally {
        setPublishProgress((current) => ({ ...current, done: current.done + 1 }));
      }
    }
    setNotice(
      failed > 0
        ? t('scanner.review.publishPartial', { success: succeeded, failed })
        : t('scanner.review.publishDone', { count: succeeded }),
    );
    setPublishing(false);
  };

  const selectedCard = activeItem?.sale.selectedCard ?? null;
  const activeStatusLabel = activeItem
    ? activeItem.sale.publishStatus === 'published'
      ? t('scanner.review.published')
      : activeItem.sale.publishStatus === 'failed'
        ? t('scanner.review.publishFailed')
        : activeItem.status === 'confirmed'
          ? t('scanner.review.confirmed')
          : activeItem.status === 'needs_review'
            ? t('scanner.review.needsReview')
            : activeItem.status === 'rejected'
              ? t('scanner.review.rejected')
              : t('scanner.review.recognized')
    : '';

  return (
    <main className="min-h-screen bg-[#07101d] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#07101d]/90 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/scanner')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5"
            aria-label={t('scanner.review.backToScanner')}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-bold">
              {t('scanner.review.sellTitle')}
            </h1>
            <p className="text-xs text-white/55">
              {t('scanner.review.sellSummary', {
                confirmed: totals.confirmed,
                count: totals.captured,
                published: totals.published,
              })}
            </p>
          </div>
          {session.items.length > 0 && (
            <button
              type="button"
              onClick={() => void clearBatch()}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-red-400/20 bg-red-500/10 text-red-300"
              aria-label={t('scanner.review.clear')}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-5 pb-40">
        {!hydrated ? (
          <div className="flex justify-center py-20">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-[#FF7300]" />
          </div>
        ) : session.items.length === 0 ? (
          <section className="rounded-3xl border border-white/10 bg-white/5 px-6 py-14 text-center">
            <RotateCcw className="mx-auto h-10 w-10 text-[#FF7300]" aria-hidden />
            <h2 className="mt-4 text-lg font-semibold">{t('scanner.review.emptyTitle')}</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/55">
              {t('scanner.review.emptyBody')}
            </p>
            <Link
              href="/scanner"
              className="mt-6 inline-flex rounded-2xl bg-[#FF7300] px-5 py-3 text-sm font-bold text-[#1a0f08]"
            >
              {t('scanner.review.backToScanner')}
            </Link>
          </section>
        ) : activeItem ? (
          <div className="space-y-4">
            <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/45">
                    {t('scanner.review.language')}
                    <select
                      value={defaultLanguage}
                      onChange={(event) => setDefaultLanguage(event.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-white/15 bg-[#111b2b] px-3 text-sm font-semibold text-white"
                    >
                      {REVIEW_LANGUAGE_CODES.map((code) => (
                        <option key={code} value={code}>
                          {CARD_LANGUAGE_LABEL_BY_CODE[code] ?? code.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/45">
                    {t('scanner.review.condition')}
                    <select
                      value={defaultCondition}
                      onChange={(event) => setDefaultCondition(event.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-white/15 bg-[#111b2b] px-3 text-sm font-semibold text-white"
                    >
                      {SELL_SINGLE_CONDITION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => applySaleDefaults({ language: defaultLanguage, condition: defaultCondition })}
                    className="self-end rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-xs font-bold text-white"
                  >
                    {t('scanner.review.applyDefaults')}
                  </button>
                  <button
                    type="button"
                    onClick={applySuggestedPrices}
                    className="self-end rounded-xl border border-[#FF7300]/35 bg-[#FF7300]/10 px-3 py-2.5 text-xs font-bold text-[#FFB275]"
                  >
                    {t('scanner.review.useSuggestedPrices')}
                  </button>
                </div>
                {catalogQuery.isFetching && (
                  <p className="flex items-center gap-2 text-xs text-white/45">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    {t('scanner.review.loadingCatalog')}
                  </p>
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                    {t('scanner.review.position', { current: activeIndex + 1, count: session.items.length })}
                  </p>
                  <h2 className="mt-0.5 font-semibold">{activeItem.result.card_name}</h2>
                </div>
                <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold', statusClass(activeItem))}>
                  {activeStatusLabel}
                </span>
              </div>

              <div className="grid gap-5 p-4 lg:grid-cols-[240px_1fr]">
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
                    {t('scanner.review.capturedCard')}
                  </p>
                  <div className="relative mx-auto aspect-[5/7] w-full max-w-[220px] overflow-hidden rounded-2xl bg-white/10">
                    {captureUrl || activeItem.result.image_uri ? (
                      <Image
                        src={captureUrl ?? activeItem.result.image_uri ?? ''}
                        alt={activeItem.result.card_name}
                        fill
                        sizes="220px"
                        className="object-cover"
                        unoptimized={Boolean(captureUrl)}
                      />
                    ) : null}
                  </div>
                  <p className="mt-2 text-center text-xs text-white/45">
                    {t('scanner.review.scannerGuess', {
                      set: activeItem.result.set_name || '—',
                      pct: Math.round(activeItem.result.confidence * 100),
                    })}
                  </p>
                </div>

                <div className="min-w-0 space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                        {t('scanner.review.officialCard')}
                      </p>
                      {selectedCard?.blueprintId ? (
                        <span className="text-[10px] text-white/35">#{selectedCard.blueprintId}</span>
                      ) : null}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                      {candidateCards.map((card) => {
                        const selected = selectedCard && officialCardKey(selectedCard) === officialCardKey(card);
                        return (
                          <button
                            key={officialCardKey(card)}
                            type="button"
                            disabled={activeItem.sale.publishStatus === 'published'}
                            onClick={() => selectCatalogCard(activeItem.id, card)}
                            className={cn(
                              'overflow-hidden rounded-xl border bg-white/5 text-left transition',
                              selected
                                ? 'border-emerald-400 ring-2 ring-emerald-400/20'
                                : 'border-white/10 hover:border-white/30',
                            )}
                          >
                            <div className="relative aspect-[5/7] w-full bg-white/10">
                              {card.image ? (
                                <Image src={card.image} alt="" fill sizes="130px" className="object-cover" />
                              ) : null}
                              {selected && (
                                <span className="absolute right-1.5 top-1.5 rounded-full bg-emerald-400 p-1 text-emerald-950">
                                  <Check className="h-3 w-3" aria-hidden />
                                </span>
                              )}
                            </div>
                            <div className="p-2">
                              <p className="truncate text-[11px] font-bold text-white">{card.setName}</p>
                              <p className="truncate text-[10px] text-white/45">
                                {card.setCode?.toUpperCase() ?? '—'}
                                {card.collectorNumber ? ` · #${card.collectorNumber}` : ''}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {!catalogQuery.isFetching && candidateCards.length === 0 && (
                      <p className="mt-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                        {t('scanner.review.noCandidates')}
                      </p>
                    )}
                  </div>

                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40">
                    {t('scanner.review.searchOfficialCard')}
                    <span className="relative mt-1 block">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" aria-hidden />
                      <input
                        type="search"
                        value={manualQuery}
                        onChange={(event) => setManualQuery(event.target.value)}
                        placeholder={t('scanner.review.searchPlaceholder')}
                        className="h-11 w-full rounded-xl border border-white/15 bg-[#111b2b] pl-9 pr-3 text-sm text-white outline-none focus:border-[#FF7300]/60"
                      />
                    </span>
                  </label>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                      {t('scanner.review.quantity')}
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={activeItem.quantity}
                        disabled={activeItem.sale.publishStatus === 'published'}
                        onChange={(event) => {
                          const quantity = Math.max(1, Math.min(100, Number(event.target.value) || 1));
                          updateItem(activeItem.id, (item) => ({ ...item, quantity }));
                        }}
                        className="mt-1 h-11 w-full rounded-xl border border-white/15 bg-[#111b2b] px-3 text-sm font-semibold text-white"
                      />
                    </label>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                      {t('scanner.review.price')}
                      <input
                        type="text"
                        inputMode="decimal"
                        value={activeItem.sale.price}
                        disabled={activeItem.sale.publishStatus === 'published'}
                        onChange={(event) => updateSale(activeItem.id, {
                          price: event.target.value,
                          priceTouched: true,
                        })}
                        placeholder="0,00"
                        className="mt-1 h-11 w-full rounded-xl border border-white/15 bg-[#111b2b] px-3 text-sm font-semibold text-white"
                      />
                    </label>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                      {t('scanner.review.language')}
                      <select
                        value={activeItem.sale.language}
                        disabled={activeItem.sale.publishStatus === 'published'}
                        onChange={(event) => updateSale(activeItem.id, { language: event.target.value })}
                        className="mt-1 h-11 w-full rounded-xl border border-white/15 bg-[#111b2b] px-3 text-sm font-semibold text-white"
                      >
                        {REVIEW_LANGUAGE_CODES.map((code) => (
                          <option key={code} value={code}>
                            {CARD_LANGUAGE_LABEL_BY_CODE[code] ?? code.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                      {t('scanner.review.condition')}
                      <select
                        value={activeItem.sale.condition}
                        disabled={activeItem.sale.publishStatus === 'published'}
                        onChange={(event) => updateSale(activeItem.id, { condition: event.target.value })}
                        className="mt-1 h-11 w-full rounded-xl border border-white/15 bg-[#111b2b] px-3 text-sm font-semibold text-white"
                      >
                        {SELL_SINGLE_CONDITION_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {activeItem.sale.publishError && (
                    <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                      {activeItem.sale.publishError}
                    </p>
                  )}
                  {notice && (
                    <p className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100" role="status">
                      {notice}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={activeItem.sale.publishStatus === 'published'}
                      onClick={confirmActive}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-emerald-950 disabled:opacity-40"
                    >
                      <Check className="h-4 w-4" aria-hidden />
                      {t('scanner.review.confirmAndNext')}
                    </button>
                    <button
                      type="button"
                      disabled={activeItem.sale.publishStatus === 'published'}
                      onClick={() => {
                        setItemStatus(activeItem.id, 'rejected');
                        goToNextPending();
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/55 disabled:opacity-40"
                      aria-label={t('scanner.review.reject')}
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      disabled={activeItem.sale.publishStatus === 'published'}
                      onClick={() => removeItem(activeItem.id)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/15 bg-red-500/10 text-red-300 disabled:opacity-40"
                      aria-label={t('scanner.review.remove')}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
                <button
                  type="button"
                  disabled={activeIndex === 0}
                  onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
                  className="flex items-center gap-1 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                  {t('scanner.review.previous')}
                </button>
                <div className="flex max-w-[50%] gap-1 overflow-x-auto py-1">
                  {session.items.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={cn(
                        'h-2.5 w-2.5 shrink-0 rounded-full',
                        index === activeIndex
                          ? 'bg-[#FF7300] ring-2 ring-[#FF7300]/25'
                          : item.sale.publishStatus === 'published'
                            ? 'bg-sky-400'
                            : item.status === 'confirmed'
                              ? 'bg-emerald-400'
                              : item.status === 'rejected'
                                ? 'bg-white/20'
                                : 'bg-amber-300',
                      )}
                      aria-label={t('scanner.review.goToCard', { number: index + 1 })}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  disabled={activeIndex >= session.items.length - 1}
                  onClick={() => setActiveIndex((index) => Math.min(session.items.length - 1, index + 1))}
                  className="flex items-center gap-1 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold disabled:opacity-30"
                >
                  {t('scanner.review.next')}
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </div>

      {session.items.length > 0 && (
        <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[#07101d]/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
          <div className="mx-auto max-w-5xl">
            {publishing && (
              <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-emerald-400 transition-[width]"
                  style={{
                    width: `${publishProgress.total > 0 ? (publishProgress.done / publishProgress.total) * 100 : 0}%`,
                  }}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/scanner"
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-center text-sm font-semibold"
              >
                {t('scanner.review.continueScanning')}
              </Link>
              {user?.id ? (
                <button
                  type="button"
                  disabled={publishing || readyCards === 0}
                  onClick={() => void publishReadyCards()}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-[#FF7300] px-4 py-3 text-sm font-bold text-[#1a0f08] disabled:bg-white/10 disabled:text-white/35"
                >
                  {publishing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Tag className="h-4 w-4" aria-hidden />}
                  {publishing
                    ? t('scanner.review.publishing', {
                        current: publishProgress.done,
                        count: publishProgress.total,
                      })
                    : t('scanner.review.publishReady', { count: readyCards })}
                </button>
              ) : (
                <Link
                  href="/login?redirect=/scanner/review"
                  className="rounded-2xl bg-[#FF7300] px-4 py-3 text-center text-sm font-bold text-[#1a0f08]"
                >
                  {t('scanner.review.loginToPublish')}
                </Link>
              )}
            </div>
            <p className="mt-2 text-center text-[11px] text-white/35">
              {t('scanner.review.localUntilPublish')}
            </p>
          </div>
        </footer>
      )}
    </main>
  );
}
