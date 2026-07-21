'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  ArrowRight,
  Clock3,
  Loader2,
  Search,
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
  const isProposer = userId === trade.proposer_id;
  const otherName = isProposer
    ? trade.receiver_display_name
    : trade.proposer_display_name;
  const giveItems = isProposer ? offered : requested;
  const receiveItems = isProposer ? requested : offered;
  const giveCount = isProposer ? offeredCount : requestedCount;
  const receiveCount = isProposer ? requestedCount : offeredCount;
  const givePreview = giveItems.slice(0, 2);
  const receivePreview = receiveItems.slice(0, 2);

  const preview = (items: Trade['items'], fallback: string, rotate: 'left' | 'right') => (
    <div className="flex -space-x-4">
      {items.length ? items.map((item, index) => (
        <TradeCardThumb
          key={item.id}
          image={catalog[item.blueprint_id]?.image}
          name={catalog[item.blueprint_id]?.name || t('trades.cardFallback', { id: item.blueprint_id })}
          className={cn(
            'h-[54px] w-[39px] ring-2 ring-white sm:h-[62px] sm:w-[45px]',
            index === 1 && rotate === 'left' && '-rotate-3',
            index === 1 && rotate === 'right' && 'rotate-3',
          )}
        />
      )) : <TradeCardThumb name={fallback} className="h-[54px] w-[39px] ring-2 ring-white sm:h-[62px] sm:w-[45px]" />}
    </div>
  );

  return (
    <Link
      href={`/scambi/${trade.id}`}
      className={cn(
        scambiGlassLight,
        'group relative grid gap-4 overflow-hidden rounded-[1.5rem] p-4 outline-none transition duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_22px_58px_rgba(3,9,24,0.2)] focus-visible:ring-2 focus-visible:ring-[#FF8A26]/60 motion-reduce:transform-none lg:grid-cols-[minmax(170px,.7fr)_minmax(0,1.5fr)_auto] lg:items-center lg:gap-6 lg:px-5',
      )}
    >
      <span className="absolute inset-y-4 left-0 w-1 rounded-r-full bg-[#FF7300] opacity-70 transition-opacity group-hover:opacity-100" />

      <div className="min-w-0 pl-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide', STATUS_STYLE[trade.status])}>
            {t(statusKey(trade.status))}
          </span>
          <span className="text-[11px] font-bold text-slate-400">#{trade.id}</span>
        </div>
        <p className="mt-2 truncate text-base font-black text-[#162A55]">{otherName || t('trades.user')}</p>
        <p className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          <Clock3 className="h-3.5 w-3.5" aria-hidden />
          {new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(trade.updated_at))}
        </p>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 sm:gap-5">
        <div className="flex min-w-0 items-center gap-3">
          {preview(givePreview, t('trades.offered'), 'left')}
          <div className="min-w-0">
            <span className="block text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">{t('trades.youOffer')}</span>
            <span className="mt-0.5 block text-sm font-black text-[#1D3160]">{t('trades.cardsCount', { count: giveCount })}</span>
          </div>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-orange-100 bg-white text-[#FF7300] shadow-sm" aria-hidden>
          <ArrowLeftRight className="h-4 w-4" />
        </span>
        <div className="flex min-w-0 flex-row-reverse items-center gap-3 text-right">
          {preview(receivePreview, t('trades.requested'), 'right')}
          <div className="min-w-0">
            <span className="block text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">{t('trades.youReceive')}</span>
            <span className="mt-0.5 block text-sm font-black text-[#1D3160]">{t('trades.cardsCount', { count: receiveCount })}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-3 lg:border-0 lg:pt-0">
        <span className="text-xs font-black uppercase tracking-wide text-[#FF7300] lg:hidden">{t('trades.open')}</span>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#132750] text-white transition-all duration-200 group-hover:bg-[#FF7300] group-hover:shadow-lg group-hover:shadow-orange-200">
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
      <div className="container-content mx-auto max-w-6xl pb-16 pt-6 md:pb-24 md:pt-10">
        <section className="relative z-[90] overflow-visible">
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(380px,.85fr)] lg:items-end lg:gap-10">
            <div className="animate-in fade-in slide-in-from-left-2 duration-500 motion-reduce:animate-none">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-orange-200">
                <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden /> {t('trades.title')}
              </span>
              <h1 className="max-w-3xl text-3xl font-black leading-[1.02] tracking-tight text-white sm:text-4xl lg:text-[3rem]">
                {t('trades.heroTitle')}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/62 sm:text-base">
                {t('trades.heroSubtitle')}
              </p>
            </div>

            <div className={cn(scambiGlass, 'group/search relative isolate animate-in rounded-[1.5rem] p-4 fade-in slide-in-from-right-2 duration-500 motion-reduce:animate-none')}>
              <div className="mb-3 flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-400/15 text-orange-200">
                  <Search className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-white">{t('trades.searchTitle')}</p>
                  <p className="mt-0.5 text-[11px] text-white/45">{t('trades.searchHint')}</p>
                </div>
              </div>
              <GlobalSearchBar />
            </div>
          </div>
        </section>

        <section className="relative mt-10 animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-200/70">{t('trades.subtitle')}</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">{t('trades.hubTitle')}</h2>
            </div>
            <Link href="/aiuto" className="self-start text-xs font-bold text-white/60 transition-colors hover:text-white">
              {t('trades.help')}
            </Link>
          </div>

          <div
            className="sticky top-3 z-40 mb-4 grid w-full grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-[#0A1730]/90 p-1.5 shadow-[0_12px_32px_rgba(3,9,24,0.22)] backdrop-blur-xl sm:w-fit"
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
                    'inline-flex h-11 min-w-0 items-center justify-center rounded-xl px-3 text-center text-[10px] font-black uppercase leading-tight tracking-wide transition-all duration-200 sm:min-w-max sm:px-6 sm:text-[11px]',
                    active
                      ? 'bg-white text-[#162A55] shadow-[0_4px_14px_rgba(3,9,24,0.22)]'
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
                <h3 className="text-lg font-black uppercase text-white">{t('trades.emptyTitle')}</h3>
                <p className="mt-1 max-w-md text-sm text-white/60">{t('trades.emptyText')}</p>
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
