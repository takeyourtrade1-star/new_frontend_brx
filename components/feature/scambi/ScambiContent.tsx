'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Inbox, Loader2, RefreshCw, Search, Send } from 'lucide-react';
import { OrderTabs, type OrderTab } from '@/components/feature/ordini/OrderTabs';
import GlobalSearchBar from '@/components/layout/GlobalSearchBar';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useTrades } from '@/lib/hooks/use-trades';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { Trade, TradeStatus } from '@/types/trade';

type TabId = 'received' | 'sent' | 'closed';

const ACTIVE: TradeStatus[] = ['PROPOSED', 'ACCEPTING', 'ACCEPTED', 'DISPUTED'];
const CLOSED: TradeStatus[] = ['COMPLETED', 'CANCELLED', 'DECLINED', 'EXPIRED', 'COUNTERED'];

function statusKey(status: TradeStatus) {
  return `trades.status.${status}` as const;
}

function TradeRow({ trade }: { trade: Trade }) {
  const { t } = useTranslation();
  const userId = useAuthStore((state) => state.user?.id);
  const offered = trade.items.filter((item) => item.direction === 'offered');
  const requested = trade.items.filter((item) => item.direction === 'requested');
  const otherName = userId === trade.proposer_id
    ? trade.receiver_display_name
    : trade.proposer_display_name;

  return (
    <Link
      href={`/scambi/${trade.id}`}
      className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-[#FF7300]/60 hover:shadow-md"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#FF7300]">
        <RefreshCw className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-[#1D3160]">#{trade.id}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
            {t(statusKey(trade.status))}
          </span>
        </div>
        <p className="mt-1 truncate text-sm text-gray-600">{otherName || t('trades.user')}</p>
        <p className="text-xs text-gray-400">
          {t('trades.summary', { offered: offered.length, requested: requested.length })}
        </p>
      </div>
      <ArrowRight className="h-5 w-5 text-gray-300 transition group-hover:text-[#FF7300]" aria-hidden />
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
  const trades = query.data?.data ?? [];

  const leftTabs: OrderTab<TabId>[] = [
    { id: 'received', label: t('trades.tabs.received'), icon: Inbox },
    { id: 'sent', label: t('trades.tabs.sent'), icon: Send },
  ];
  const rightTabs: OrderTab<TabId>[] = [
    { id: 'closed', label: t('trades.tabs.closed'), icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-[#F5F4F0]">
      <div className="container-content mx-auto py-8 md:py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wide text-[#1D3160] sm:text-3xl">
              {t('trades.title')}
            </h1>
            <p className="mt-1 text-sm text-gray-500">{t('trades.subtitle')}</p>
          </div>
          <Link href="/aiuto" className="text-sm font-bold text-[#FF7300] hover:underline">
            {t('trades.help')}
          </Link>
        </div>

        <div className="relative z-[80] mb-6 rounded-2xl bg-[#1D3160] p-2 shadow-sm sm:p-3">
          <div className="mb-2 flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-wide text-white/70">
            <Search className="h-4 w-4" aria-hidden /> {t('trades.searchHint')}
          </div>
          <GlobalSearchBar />
        </div>

        <div className="mb-6">
          <OrderTabs leftTabs={leftTabs} rightTabs={rightTabs} activeTab={tab} onChange={setTab} />
        </div>

        {query.isLoading ? (
          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-gray-200 bg-white">
            <Loader2 className="h-7 w-7 animate-spin text-[#FF7300]" aria-label={t('trades.loading')} />
          </div>
        ) : query.isError ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-red-100 bg-white p-6 text-center">
            <p className="text-sm text-red-700">{t('trades.loadError')}</p>
            <button type="button" onClick={() => query.refetch()} className="rounded-full bg-[#1D3160] px-5 py-2 text-sm font-bold text-white">
              {t('trades.retry')}
            </button>
          </div>
        ) : trades.length === 0 ? (
          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center">
            <p className="text-sm font-bold uppercase tracking-wide text-gray-400">{t('trades.empty')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {trades.map((trade) => <TradeRow key={trade.id} trade={trade} />)}
          </div>
        )}
      </div>
    </div>
  );
}
