'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Clock3,
  Loader2,
} from 'lucide-react';
import GlobalSearchBar from '@/components/layout/GlobalSearchBar';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useTrades } from '@/lib/hooks/use-trades';
import { useMeilisearchCards } from '@/lib/hooks/use-meilisearch-cards';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { Trade, TradeStatus } from '@/types/trade';
import { ScambiShell, TradeCardThumb, scambiGlass, scambiGlassLight } from './ScambiShell';

type TabId = 'received' | 'sent' | 'closed';

const ACTIVE: TradeStatus[] = ['PROPOSED', 'ACCEPTING', 'ACCEPTED', 'DISPUTED'];
const CLOSED: TradeStatus[] = ['COMPLETED', 'CANCELLED', 'DECLINED', 'EXPIRED', 'COUNTERED'];

const STATUS_STYLE: Record<TradeStatus, string> = {
  PROPOSED: 'border-orange-200 bg-orange-50 text-orange-700',
  ACCEPTING: 'border-sky-200 bg-sky-50 text-sky-700',
  ACCEPTED: 'border-blue-200 bg-blue-50 text-blue-700',
  DECLINED: 'border-rose-200 bg-rose-50 text-rose-700',
  CANCELLED: 'border-slate-200 bg-slate-100 text-slate-600',
  EXPIRED: 'border-slate-200 bg-slate-100 text-slate-600',
  COUNTERED: 'border-violet-200 bg-violet-50 text-violet-700',
  COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  DISPUTED: 'border-amber-200 bg-amber-50 text-amber-700',
};

function statusKey(status: TradeStatus) {
  return `trades.status.${status}` as const;
}

function TradeRow({
  trade,
  catalog,
}: {
  trade: Trade;
  catalog: Record<number, { name?: string; image?: string | null }>;
}) {
  const { t, locale } = useTranslation();
  const userId = useAuthStore((state) => state.user?.id);
  const offered = trade.items.filter((item) => item.direction === 'offered');
  const requested = trade.items.filter((item) => item.direction === 'requested');
  const offeredCount = offered.reduce((sum, item) => sum + item.quantity, 0);
  const requestedCount = requested.reduce((sum, item) => sum + item.quantity, 0);
  const otherName = userId === trade.proposer_id
    ? trade.receiver_display_name
    : trade.proposer_display_name;
  const offeredPreview = offered.slice(0, 2);
  const requestedPreview = requested.slice(0, 2);

  return (
    <Link
      href={`/scambi/${trade.id}`}
      className={cn(
        scambiGlassLight,
        'group relative grid gap-4 overflow-hidden rounded-[1.35rem] p-4 outline-none transition duration-200 hover:-translate-y-0.5 hover:border-white/90 hover:shadow-[0_16px_42px_rgba(6,14,35,0.16)] focus-visible:ring-2 focus-visible:ring-[#FF8A26]/60 motion-reduce:transform-none sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5',
      )}
    >
      <span className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-[#FF7300] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <div className="flex items-center">
          <div className="flex -space-x-5">
            {offeredPreview.length ? offeredPreview.map((item, index) => (
              <TradeCardThumb
                key={item.id}
                image={catalog[item.blueprint_id]?.image}
                name={catalog[item.blueprint_id]?.name || t('trades.cardFallback', { id: item.blueprint_id })}
                className={cn('h-[48px] w-[35px] sm:h-[58px] sm:w-[42px]', index === 1 && 'hidden rotate-3 sm:block')}
              />
            )) : <TradeCardThumb name={t('trades.offered')} className="h-[48px] w-[35px] sm:h-[58px] sm:w-[42px]" />}
          </div>
          <span className="relative z-10 -mx-1 h-px w-4 bg-gradient-to-r from-[#1D3160]/35 via-[#FF7300] to-[#1D3160]/35" aria-hidden />
          <div className="flex -space-x-5">
            {requestedPreview.length ? requestedPreview.map((item, index) => (
              <TradeCardThumb
                key={item.id}
                image={catalog[item.blueprint_id]?.image}
                name={catalog[item.blueprint_id]?.name || t('trades.cardFallback', { id: item.blueprint_id })}
                className={cn('h-[48px] w-[35px] sm:h-[58px] sm:w-[42px]', index === 1 && 'hidden -rotate-3 sm:block')}
              />
            )) : <TradeCardThumb name={t('trades.requested')} className="h-[48px] w-[35px] sm:h-[58px] sm:w-[42px]" />}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-black text-[#1D3160]">{otherName || t('trades.user')}</span>
            <span className={cn('rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide', STATUS_STYLE[trade.status])}>
              {t(statusKey(trade.status))}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {t('trades.exchangeSummary', { offered: offeredCount, requested: requestedCount })}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
            <Clock3 className="h-3.5 w-3.5" aria-hidden />
            {new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(trade.updated_at))}
            <span className="h-3 w-px bg-slate-300" aria-hidden />
            #{trade.id}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3 sm:border-0 sm:pt-0">
        <span className="text-xs font-black uppercase tracking-wide text-[#FF7300] sm:hidden">{t('trades.open')}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors duration-200 group-hover:bg-[#FF7300] group-hover:text-white">
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

export function ScambiContent() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabId>('received');
  const params = tab === 'closed'
    ? { statuses: CLOSED, limit: 50 }
    : { role: tab as 'received' | 'sent', statuses: ACTIVE, limit: 50 };
  const query = useTrades(params);
  const trades = useMemo(() => query.data?.data ?? [], [query.data?.data]);
  const blueprintIds = useMemo(
    () => [...new Set(trades.flatMap((trade) => trade.items.map((item) => item.blueprint_id)))],
    [trades],
  );
  const { data: catalog = {} } = useMeilisearchCards(blueprintIds);

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'received', label: t('trades.tabs.received') },
    { id: 'sent', label: t('trades.tabs.sent') },
    { id: 'closed', label: t('trades.tabs.closed') },
  ];
  const focusTab = (nextTab: TabId) => {
    setTab(nextTab);
    window.requestAnimationFrame(() => document.getElementById(`trades-tab-${nextTab}`)?.focus());
  };

  return (
    <ScambiShell>
      <div className="container-content mx-auto pb-16 pt-5 md:pb-24 md:pt-6">
        <section className="relative z-[90] overflow-visible py-2 sm:py-3">
          <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,1fr)] lg:items-center lg:gap-2">
            <div className="animate-in fade-in slide-in-from-left-2 duration-500 motion-reduce:animate-none">
              <h1 className="max-w-3xl text-2xl font-black uppercase leading-[1.04] tracking-tight text-white sm:text-3xl lg:text-[2.65rem]">
                {t('trades.heroTitle')}
              </h1>
              <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-white/70">
                {t('trades.heroSubtitle')}
              </p>
            </div>

            <div className="group/search relative isolate animate-in rounded-[1.35rem] border border-white/15 bg-[#0C1730]/28 p-3 shadow-inner backdrop-blur-xl fade-in slide-in-from-right-2 transition-all duration-500 hover:-translate-y-0.5 hover:border-[#FF8A26]/60 hover:bg-[#0C1730]/48 hover:shadow-[0_0_0_1px_rgba(255,115,0,0.16),0_14px_36px_rgba(5,12,32,0.28)] focus-within:-translate-y-0.5 focus-within:border-[#FF8A26]/60 focus-within:bg-[#0C1730]/48 focus-within:shadow-[0_0_0_1px_rgba(255,115,0,0.16),0_14px_36px_rgba(5,12,32,0.28)] motion-reduce:animate-none motion-reduce:transform-none lg:-translate-x-5">
              <div
                className="pointer-events-none absolute -inset-1 -z-10 rounded-[1.55rem] bg-gradient-to-r from-[#FF7300]/45 via-[#FF9B45]/15 to-[#6E8FFF]/35 opacity-0 blur-lg transition-opacity duration-300 group-hover/search:opacity-80 group-focus-within/search:opacity-80"
                aria-hidden
              />
              <div className="mb-2.5 flex items-start justify-between gap-3 px-1">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-white transition-colors duration-300 group-hover/search:text-[#FFAD66] group-focus-within/search:text-[#FFAD66]">{t('trades.searchTitle')}</p>
                  <p className="mt-0.5 text-[11px] text-white/55">{t('trades.searchHint')}</p>
                </div>
              </div>
              <GlobalSearchBar />
            </div>
          </div>
        </section>

        <section className="relative mt-3 animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-white sm:text-xl">{t('trades.hubTitle')}</h2>
            </div>
            <Link href="/aiuto" className="self-start text-xs font-bold text-white/60 transition-colors hover:text-white">
              {t('trades.help')}
            </Link>
          </div>

          <div
            className="sticky top-3 z-40 mb-3 grid w-full grid-cols-3 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_24px_rgba(6,14,35,0.12)] backdrop-blur-xl sm:w-fit"
            role="tablist"
            aria-label={t('trades.title')}
          >
            {tabs.map(({ id, label }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`trades-tab-${id}`}
                  aria-controls="trades-tabpanel"
                  aria-selected={active}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setTab(id)}
                  onKeyDown={(event) => {
                    const currentIndex = tabs.findIndex((item) => item.id === id);
                    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                      event.preventDefault();
                      const offset = event.key === 'ArrowRight' ? 1 : -1;
                      const nextIndex = (currentIndex + offset + tabs.length) % tabs.length;
                      focusTab(tabs[nextIndex].id);
                    } else if (event.key === 'Home' || event.key === 'End') {
                      event.preventDefault();
                      focusTab(event.key === 'Home' ? tabs[0].id : tabs[tabs.length - 1].id);
                    }
                  }}
                  className={cn(
                    'inline-flex h-11 min-w-0 items-center justify-center rounded-xl px-3 text-center text-[10px] font-black uppercase leading-tight tracking-wide transition-all duration-200 sm:min-w-max sm:px-5 sm:text-[11px]',
                    active
                      ? 'bg-white text-[#FF7300] shadow-[0_2px_8px_rgba(6,14,35,0.16)]'
                      : 'text-white/55 hover:bg-white/[0.06] hover:text-white',
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div
            id="trades-tabpanel"
            role="tabpanel"
            aria-labelledby={`trades-tab-${tab}`}
            tabIndex={0}
            className="rounded-[1.5rem] outline-none focus-visible:ring-2 focus-visible:ring-white/35"
          >
            {query.isLoading ? (
              <div className={cn(scambiGlass, 'flex min-h-56 items-center justify-center rounded-[1.5rem]')}>
                <Loader2 className="h-7 w-7 animate-spin text-[#FF8A26]" aria-label={t('trades.loading')} />
              </div>
            ) : query.isError ? (
              <div className={cn(scambiGlass, 'flex min-h-56 flex-col items-center justify-center gap-4 rounded-[1.5rem] p-6 text-center')}>
                <p className="text-sm text-white/75">{t('trades.loadError')}</p>
                <button type="button" onClick={() => query.refetch()} className="rounded-full bg-white px-5 py-2.5 text-sm font-black text-[#1D3160] transition hover:bg-orange-50">
                  {t('trades.retry')}
                </button>
              </div>
            ) : trades.length === 0 ? (
              <div className={cn(scambiGlass, 'flex min-h-56 flex-col items-center justify-center rounded-[1.5rem] p-6 text-center')}>
                <h3 className="text-lg font-black uppercase text-white">
                  {tab === 'received'
                    ? t('trades.emptyReceivedTitle')
                    : tab === 'sent'
                      ? t('trades.emptySentTitle')
                      : t('trades.emptyClosedTitle')}
                </h3>
                <p className="mt-1 max-w-md text-sm text-white/60">
                  {tab === 'received'
                    ? t('trades.emptyReceivedText')
                    : tab === 'sent'
                      ? t('trades.emptySentText')
                      : t('trades.emptyClosedText')}
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {trades.map((trade) => <TradeRow key={trade.id} trade={trade} catalog={catalog} />)}
              </div>
            )}
          </div>
        </section>
      </div>
    </ScambiShell>
  );
}
