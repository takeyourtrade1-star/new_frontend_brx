'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { ScambiNav } from '@/components/feature/scambi/ScambiNav';
import { ValidPreviewCardImage } from '@/components/feature/scambi/preview/ValidPreviewCardImage';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';
import { fetchPreviewCards, type PreviewCard } from '@/lib/scambi/preview-cards';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { cn } from '@/lib/utils';

const PREVIEW_PARTNERS = [
  { id: 'p1', name: 'Marco T.', initials: 'MT', ring: 'ring-blue-400/40' },
  { id: 'p2', name: 'Sara L.', initials: 'SL', ring: 'ring-violet-400/40' },
  { id: 'p3', name: 'Luca B.', initials: 'LB', ring: 'ring-emerald-400/40' },
  { id: 'p4', name: 'Elena R.', initials: 'ER', ring: 'ring-amber-400/40' },
] as const;

const POOL_SIZE = 36;
const OFFER_SLOTS = 8;
const REQUEST_SLOTS = 8;

function useValidatedCards(cards: PreviewCard[]) {
  const [invalidIds, setInvalidIds] = useState<Set<string>>(() => new Set());

  const markInvalid = useCallback((id: string) => {
    setInvalidIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const validCards = useMemo(
    () => cards.filter((c) => !invalidIds.has(c.id)),
    [cards, invalidIds]
  );

  return { validCards, markInvalid };
}

function PreviewCardTile({
  card,
  selected,
  onToggle,
  onInvalid,
}: {
  card: PreviewCard;
  selected: boolean;
  onToggle: () => void;
  onInvalid: () => void;
}) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border bg-white/90 p-1.5 text-left shadow-sm transition-all duration-200',
        selected
          ? 'border-[#FF7300]/80 shadow-lg shadow-orange-500/15 ring-2 ring-[#FF7300]/30'
          : 'border-white/60 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-md'
      )}
    >
      {selected && (
        <span className="absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF7300] text-white shadow">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      )}
      <div className="relative aspect-[200/280] w-full overflow-hidden rounded-xl bg-gray-100/80">
        <ValidPreviewCardImage
          src={card.imageUrl}
          alt={card.name}
          className="absolute inset-0"
          sizes="100px"
          onValidated={(ok) => {
            if (!ok) {
              setVisible(false);
              onInvalid();
            }
          }}
        />
      </div>
      <p className="mt-1.5 truncate px-0.5 text-[10px] font-semibold text-[#1D3160]">{card.name}</p>
      {card.setName ? (
        <p className="truncate px-0.5 text-[9px] text-gray-400">{card.setName}</p>
      ) : null}
    </button>
  );
}

function CommunityTradeStrip({
  trades,
}: {
  trades: { id: string; offered: PreviewCard[]; requested: PreviewCard }[];
}) {
  const { t } = useTranslation();

  if (trades.length === 0) return null;

  return (
    <section className="mt-14">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#1D3160]">
            {t('scambi.preview.communityTitle')}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">{t('scambi.preview.communitySubtitle')}</p>
        </div>
      </div>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {trades.map((trade) => (
          <article
            key={trade.id}
            className="flex w-[min(100%,320px)] shrink-0 flex-col rounded-2xl border border-white/70 bg-white/75 p-4 shadow-[0_8px_32px_rgba(29,49,96,0.08)] backdrop-blur-xl"
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {trade.offered.slice(0, 3).map((c) => (
                  <div
                    key={c.id}
                    className="relative h-10 w-7 overflow-hidden rounded-md border-2 border-white bg-gray-100 shadow-sm"
                  >
                    <ValidPreviewCardImage src={c.imageUrl} alt={c.name} className="absolute inset-0" sizes="28px" />
                  </div>
                ))}
              </div>
              <ArrowLeftRight className="h-4 w-4 shrink-0 text-[#FF7300]/70" aria-hidden />
              <div className="relative h-12 w-9 overflow-hidden rounded-lg border border-gray-100 bg-gray-50 shadow-sm">
                <ValidPreviewCardImage
                  src={trade.requested.imageUrl}
                  alt={trade.requested.name}
                  className="absolute inset-0"
                  sizes="36px"
                />
              </div>
            </div>
            <p className="mt-3 line-clamp-2 text-xs text-gray-600">
              <span className="font-medium text-[#1D3160]">{trade.offered.length} carte</span>
              {' → '}
              <span className="font-medium text-[#1D3160]">{trade.requested.name}</span>
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ScambiPreviewPage() {
  const { t } = useTranslation();

  const breadcrumbItems: AppBreadcrumbItem[] = [
    { href: '/', label: t('auctions.breadcrumbHome') ?? 'Home', isCurrent: false },
    { label: t('nav.trades'), isCurrent: true },
  ];

  const [cards, setCards] = useState<PreviewCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { validCards, markInvalid } = useValidatedCards(cards);

  const [partnerId, setPartnerId] = useState<string>(PREVIEW_PARTNERS[0].id);
  const [partnerOpen, setPartnerOpen] = useState(false);
  const partnerRef = useRef<HTMLDivElement>(null);
  const [selectedOfferIds, setSelectedOfferIds] = useState<string[]>([]);
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [simulatePulse, setSimulatePulse] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadCards = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setSelectedOfferIds([]);
    setSelectedRequestIds([]);
    try {
      const fetched = await fetchPreviewCards(POOL_SIZE);
      if (fetched.length === 0) {
        setLoadError(t('scambi.preview.loadError'));
      }
      setCards(fetched);
    } catch {
      setLoadError(t('scambi.preview.loadError'));
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadCards();
  }, [loadCards]);

  useEffect(() => {
    if (!partnerOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (partnerRef.current && !partnerRef.current.contains(e.target as Node)) {
        setPartnerOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [partnerOpen]);

  const offerPool = useMemo(() => validCards.slice(0, OFFER_SLOTS), [validCards]);
  const requestPool = useMemo(() => validCards.slice(OFFER_SLOTS, OFFER_SLOTS + REQUEST_SLOTS), [validCards]);

  const selectedOffer = useMemo(
    () => offerPool.filter((c) => selectedOfferIds.includes(c.id)),
    [offerPool, selectedOfferIds]
  );
  const selectedRequest = useMemo(
    () => requestPool.filter((c) => selectedRequestIds.includes(c.id)),
    [requestPool, selectedRequestIds]
  );

  const partner = PREVIEW_PARTNERS.find((p) => p.id === partnerId) ?? PREVIEW_PARTNERS[0];

  const communityTrades = useMemo(() => {
    if (validCards.length < 6) return [];
    const trades: { id: string; offered: PreviewCard[]; requested: PreviewCard }[] = [];
    for (let i = 0; i < Math.min(6, Math.floor(validCards.length / 3)); i++) {
      const base = i * 3;
      const offered = validCards.slice(base, base + 2);
      const requested = validCards[base + 2];
      if (offered.length >= 2 && requested) {
        trades.push({ id: `trade-${i}`, offered, requested });
      }
    }
    return trades;
  }, [validCards]);

  const toggleOffer = (id: string) => {
    setSelectedOfferIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const toggleRequest = (id: string) => {
    setSelectedRequestIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const handleSimulate = () => {
    setSimulatePulse(true);
    setToast(t('scambi.preview.simulateToast'));
    window.setTimeout(() => setSimulatePulse(false), 600);
  };

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const canSimulate = selectedOffer.length > 0 && selectedRequest.length > 0;

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#f5f5f7]">
      {/* Soft ambient background */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,115,0,0.08),transparent),radial-gradient(ellipse_60%_40%_at_100%_50%,rgba(29,49,96,0.06),transparent)]"
        aria-hidden
      />

      <ScambiNav />

      {/* Coming soon — non-blocking glass ribbon */}
      <div className="pointer-events-none sticky top-0 z-30 flex justify-center px-4 pt-3">
        <div
          className="pointer-events-auto flex max-w-lg items-center gap-2.5 rounded-full border border-white/50 bg-white/55 px-4 py-2 shadow-[0_4px_24px_rgba(29,49,96,0.08)] backdrop-blur-xl backdrop-saturate-150"
          role="status"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#FF7300] to-[#FF8800] text-white shadow-sm">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
          </span>
          <p className="text-xs font-medium leading-snug text-[#1D3160] sm:text-sm">
            <span className="font-semibold">{t('scambi.preview.badge')}</span>
            <span className="mx-1.5 hidden text-gray-300 sm:inline">·</span>
            <span className="hidden text-gray-600 sm:inline">{t('scambi.preview.badgeHint')}</span>
          </p>
        </div>
      </div>

      <section className="relative pb-20 pt-4 md:pb-16">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <AppBreadcrumb items={breadcrumbItems} className="mb-6" variant="default" />

            <header className="mb-10 text-center md:mb-12">
              <h1 className="text-4xl font-semibold tracking-tight text-[#1D3160] sm:text-5xl">
                {t('scambi.preview.title')}
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-base text-gray-500">{t('scambi.preview.subtitle')}</p>
            </header>

            {/* Partner selector */}
            <div className="mb-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-400">
                <Users className="h-3.5 w-3.5" />
                {t('scambi.preview.partner')}
              </span>
              <div className="relative" ref={partnerRef}>
                <button
                  type="button"
                  onClick={() => setPartnerOpen((o) => !o)}
                  className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 px-4 py-2.5 shadow-sm backdrop-blur-md transition hover:bg-white/90"
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#1D3160] to-[#2a4278] text-xs font-bold text-white ring-2',
                      partner.ring
                    )}
                  >
                    {partner.initials}
                  </span>
                  <span className="text-sm font-medium text-[#1D3160]">{partner.name}</span>
                  <ChevronDown
                    className={cn('h-4 w-4 text-gray-400 transition', partnerOpen && 'rotate-180')}
                  />
                </button>
                {partnerOpen && (
                  <ul
                    className="absolute left-1/2 z-20 mt-2 w-52 -translate-x-1/2 overflow-hidden rounded-2xl border border-gray-100 bg-white/95 py-1 shadow-xl backdrop-blur-xl"
                    role="listbox"
                  >
                    {PREVIEW_PARTNERS.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={p.id === partnerId}
                          onClick={() => {
                            setPartnerId(p.id);
                            setPartnerOpen(false);
                          }}
                          className={cn(
                            'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-gray-50',
                            p.id === partnerId && 'bg-orange-50/80'
                          )}
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1D3160] text-[10px] font-bold text-white">
                            {p.initials}
                          </span>
                          {p.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Trade composer */}
            <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch lg:gap-6">
              {/* Cosa offri */}
              <div className="flex flex-col rounded-3xl border border-white/70 bg-white/60 p-5 shadow-[0_12px_40px_rgba(29,49,96,0.06)] backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-[#1D3160]">
                    {t('scambi.preview.offer')}
                  </h2>
                  {selectedOffer.length > 0 && (
                    <span className="rounded-full bg-[#FF7300]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#FF7300]">
                      {selectedOffer.length}
                    </span>
                  )}
                </div>

                {loading ? (
                  <div
                    className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-gray-400"
                    aria-busy="true"
                    aria-label={t('scambi.preview.loading')}
                  >
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-xs">{t('scambi.preview.loading')}</span>
                  </div>
                ) : offerPool.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
                    <p className="text-sm text-gray-500">{loadError ?? t('scambi.preview.empty')}</p>
                    <button
                      type="button"
                      onClick={() => void loadCards()}
                      className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {t('scambi.preview.retry')}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
                    {offerPool.map((card) => (
                      <PreviewCardTile
                        key={card.id}
                        card={card}
                        selected={selectedOfferIds.includes(card.id)}
                        onToggle={() => toggleOffer(card.id)}
                        onInvalid={() => markInvalid(card.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Center swap */}
              <div className="flex items-center justify-center py-2 lg:flex-col lg:py-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/50 bg-white/50 shadow-lg backdrop-blur-md">
                  <ArrowLeftRight className="h-6 w-6 text-[#FF7300]" aria-hidden />
                </div>
              </div>

              {/* Cosa richiedi */}
              <div className="flex flex-col rounded-3xl border border-white/70 bg-white/60 p-5 shadow-[0_12px_40px_rgba(29,49,96,0.06)] backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-[#1D3160]">
                    {t('scambi.preview.request')}
                  </h2>
                  {selectedRequest.length > 0 && (
                    <span className="rounded-full bg-[#1D3160]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#1D3160]">
                      {selectedRequest.length}
                    </span>
                  )}
                </div>

                {loading ? (
                  <div className="flex flex-1 items-center justify-center py-16 text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : requestPool.length === 0 ? (
                  <p className="py-12 text-center text-sm text-gray-500">{t('scambi.preview.empty')}</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {requestPool.map((card) => (
                      <PreviewCardTile
                        key={card.id}
                        card={card}
                        selected={selectedRequestIds.includes(card.id)}
                        onToggle={() => toggleRequest(card.id)}
                        onInvalid={() => markInvalid(card.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selection summary + simulate */}
            <div className="mt-8 flex flex-col items-center gap-5">
              {(selectedOffer.length > 0 || selectedRequest.length > 0) && (
                <div className="flex flex-wrap items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-200/80 bg-white/40 px-6 py-4 backdrop-blur-sm">
                  {selectedOffer.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase text-gray-400">
                        {t('scambi.preview.offer')}
                      </span>
                      <div className="flex -space-x-2">
                        {selectedOffer.map((c) => (
                          <div
                            key={c.id}
                            className="relative h-12 w-9 overflow-hidden rounded-lg border-2 border-white bg-gray-100 shadow"
                          >
                            <ValidPreviewCardImage
                              src={c.imageUrl}
                              alt={c.name}
                              className="absolute inset-0"
                              sizes="36px"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedOffer.length > 0 && selectedRequest.length > 0 && (
                    <ArrowLeftRight className="h-4 w-4 text-[#FF7300]/60" />
                  )}
                  {selectedRequest.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase text-gray-400">
                        {t('scambi.preview.request')}
                      </span>
                      <div className="flex -space-x-2">
                        {selectedRequest.map((c) => (
                          <div
                            key={c.id}
                            className="relative h-12 w-9 overflow-hidden rounded-lg border-2 border-white bg-gray-100 shadow"
                          >
                            <ValidPreviewCardImage
                              src={c.imageUrl}
                              alt={c.name}
                              className="absolute inset-0"
                              sizes="36px"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                disabled={!canSimulate}
                onClick={handleSimulate}
                className={cn(
                  'group relative inline-flex items-center gap-2.5 overflow-hidden rounded-2xl px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-300',
                  canSimulate
                    ? 'bg-gradient-to-r from-[#FF8A3D]/90 via-[#FF7300]/90 to-[#E86800]/90 shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 active:scale-[0.98]'
                    : 'cursor-not-allowed bg-gray-300/80 text-gray-500 shadow-none',
                  simulatePulse && 'scale-[0.97]'
                )}
                style={
                  canSimulate
                    ? {
                        backdropFilter: 'blur(12px) saturate(150%)',
                        WebkitBackdropFilter: 'blur(12px) saturate(150%)',
                      }
                    : undefined
                }
              >
                <Send className="h-4 w-4" />
                {t('scambi.preview.simulate')}
                {canSimulate && (
                  <Zap className="h-3.5 w-3.5 opacity-70 transition group-hover:opacity-100" />
                )}
              </button>
              <p className="max-w-md text-center text-xs text-gray-400">{t('scambi.preview.stepHint')}</p>
            </div>

            {!loading && communityTrades.length > 0 && (
              <CommunityTradeStrip trades={communityTrades} />
            )}

            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => void loadCards()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200/80 bg-white/50 px-4 py-2 text-xs font-medium text-gray-600 backdrop-blur-sm transition hover:bg-white/80 disabled:opacity-50"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
                {t('scambi.preview.shuffle')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-300"
          role="alert"
        >
          <div className="flex items-center gap-2 rounded-2xl border border-white/40 bg-[#1D3160]/90 px-5 py-3 text-sm font-medium text-white shadow-2xl backdrop-blur-xl">
            <Sparkles className="h-4 w-4 text-[#FF7300]" />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
