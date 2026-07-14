'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, PackageCheck, RefreshCw, ShieldAlert, Truck } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useMeilisearchCards } from '@/lib/hooks/use-meilisearch-cards';
import {
  useAcceptTrade,
  useCancelTrade,
  useConfirmTradeCancel,
  useConfirmTradeReceipt,
  useDeclineTrade,
  useRequestTradeCancel,
  useShipTrade,
  useTrade,
  useTradeAssistance,
} from '@/lib/hooks/use-trades';
import { setTradeProposalContext } from '@/lib/scambi/trade-proposal-context';
import type { Trade, TradeAddress, TradeItem, TradeStatus } from '@/types/trade';

const EMPTY_ADDRESS: TradeAddress = {
  full_name: '', street: '', city: '', zip: '', province: '', country: 'IT', phone: '',
};

function statusKey(status: TradeStatus) {
  return `trades.status.${status}` as const;
}

function ItemList({ title, items, catalog }: {
  title: string;
  items: TradeItem[];
  catalog: Record<number, { name?: string }>;
}) {
  const { t } = useTranslation();
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-[#1D3160]">{title}</h2>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800">
                {catalog[item.blueprint_id]?.name || item.description || t('trades.cardFallback', { id: item.blueprint_id })}
              </p>
              <p className="text-xs text-slate-400">#{item.inventory_item_id}</p>
            </div>
            <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#1D3160] ring-1 ring-slate-200">
              × {item.quantity}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function AddressFields({ value, onChange }: { value: TradeAddress; onChange: (value: TradeAddress) => void }) {
  const { t } = useTranslation();
  const field = (key: keyof TradeAddress, label: string, required = false) => (
    <label className="text-xs font-bold text-slate-600">
      {label}
      <input
        required={required}
        value={value[key] ?? ''}
        onChange={(event) => onChange({ ...value, [key]: event.target.value })}
        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-[#FF7300]"
      />
    </label>
  );
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {field('full_name', t('trades.address.fullName'), true)}
      {field('street', t('trades.address.street'), true)}
      {field('city', t('trades.address.city'), true)}
      {field('zip', t('trades.address.zip'), true)}
      {field('province', t('trades.address.province'))}
      {field('country', t('trades.address.country'), true)}
      {field('phone', t('trades.address.phone'))}
    </div>
  );
}

export function ScambiDetailView({ scambioId }: { scambioId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const tradeId = Number(scambioId);
  const user = useAuthStore((state) => state.user);
  const query = useTrade(tradeId);
  const trade = query.data?.data;
  const [address, setAddress] = useState<TradeAddress>(EMPTY_ADDRESS);
  const [carrier, setCarrier] = useState('');
  const [tracking, setTracking] = useState('');
  const [assistanceReason, setAssistanceReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const accept = useAcceptTrade();
  const decline = useDeclineTrade();
  const cancel = useCancelTrade();
  const ship = useShipTrade();
  const confirmReceipt = useConfirmTradeReceipt();
  const requestCancel = useRequestTradeCancel();
  const confirmCancel = useConfirmTradeCancel();
  const assistance = useTradeAssistance();
  const busy = [accept, decline, cancel, ship, confirmReceipt, requestCancel, confirmCancel, assistance]
    .some((mutation) => mutation.isPending);

  const blueprintIds = useMemo(
    () => [...new Set((trade?.items ?? []).map((item) => item.blueprint_id))],
    [trade?.items],
  );
  const { data: catalog = {} } = useMeilisearchCards(blueprintIds);

  if (query.isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#FF7300]" /></div>;
  }
  if (!trade || !Number.isInteger(tradeId)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-xl font-black text-[#1D3160]">{t('trades.notFound')}</h1>
        <Link href="/scambi" className="rounded-full bg-[#FF7300] px-5 py-2.5 text-sm font-bold text-white">{t('trades.back')}</Link>
      </div>
    );
  }

  const offered = trade.items.filter((item) => item.direction === 'offered');
  const requested = trade.items.filter((item) => item.direction === 'requested');
  const isProposer = user?.id === trade.proposer_id;
  const isReceiver = user?.id === trade.receiver_id;
  const me = trade.parties?.find((party) => party.user_id === user?.id);
  const other = trade.parties?.find((party) => party.user_id !== user?.id);
  const validAddress = Boolean(address.full_name && address.street && address.city && address.zip && address.country);

  const perform = async (operation: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await operation();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : t('trades.actionError'));
    }
  };

  const startCounter = () => {
    const first = offered[0];
    if (!first) return;
    setTradeProposalContext({
      mode: 'counter',
      parentTradeId: trade.id,
      seller: {
        name: trade.proposer_display_name || t('trades.user'),
        isPro: false,
        country: null,
      },
      listing: {
        id: first.inventory_source === 'marketplace'
          ? `mkt:${first.marketplace_listing_id}`
          : `sync:${first.inventory_item_id}`,
        source: first.inventory_source,
        sellerId: trade.proposer_id,
        quantity: first.quantity,
      },
      card: {
        id: String(first.blueprint_id),
        name: catalog[first.blueprint_id]?.name || t('trades.cardFallback', { id: first.blueprint_id }),
        image: '',
        condition: '',
        priceEur: first.price_cents / 100,
        game: null,
      },
      requestedItems: offered.map((item) => ({
        source: item.inventory_source,
        inventoryItemId: item.inventory_item_id ?? undefined,
        marketplaceListingId: item.marketplace_listing_id ?? undefined,
        blueprintId: item.blueprint_id,
        quantity: item.quantity,
        name: catalog[item.blueprint_id]?.name,
      })),
    });
    router.push('/scambi/proponi');
  };

  return (
    <div className="min-h-screen bg-[#F5F4F0] py-8">
      <div className="container-content mx-auto max-w-5xl">
        <Link href="/scambi" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#FF7300]">
          <ArrowLeft className="h-4 w-4" /> {t('trades.back')}
        </Link>

        <header className="mb-5 rounded-2xl bg-[#1D3160] p-5 text-white shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/60">{t('trades.tradeNumber', { id: trade.id })}</p>
              <h1 className="mt-1 text-2xl font-black">{t(statusKey(trade.status))}</h1>
            </div>
            <RefreshCw className="h-8 w-8 text-[#FF7300]" aria-hidden />
          </div>
          {trade.message && <p className="mt-4 rounded-xl bg-white/10 p-3 text-sm text-white/85">{trade.message}</p>}
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <ItemList title={t('trades.offered')} items={offered} catalog={catalog} />
          <ItemList title={t('trades.requested')} items={requested} catalog={catalog} />
        </div>

        {trade.status === 'PROPOSED' && isReceiver && (
          <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-black uppercase text-[#1D3160]">{t('trades.acceptTitle')}</h2>
            <AddressFields value={address} onChange={setAddress} />
            <div className="mt-5 flex flex-wrap gap-2">
              <button disabled={busy || !validAddress} onClick={() => void perform(() => accept.mutateAsync({ tradeId, address }))} className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40">
                {t('trades.accept')}
              </button>
              <button disabled={busy} onClick={() => void perform(() => decline.mutateAsync({ tradeId }))} className="rounded-full border border-red-200 px-5 py-2.5 text-sm font-bold text-red-700 disabled:opacity-40">
                {t('trades.decline')}
              </button>
              <button disabled={busy} onClick={startCounter} className="rounded-full border border-[#1D3160]/20 px-5 py-2.5 text-sm font-bold text-[#1D3160] disabled:opacity-40">
                {t('trades.counter')}
              </button>
            </div>
          </section>
        )}

        {trade.status === 'PROPOSED' && isProposer && (
          <button disabled={busy} onClick={() => void perform(() => cancel.mutateAsync({ tradeId }))} className="mt-5 rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-bold text-red-700 disabled:opacity-40">
            {t('trades.cancelProposal')}
          </button>
        )}

        {(trade.status === 'ACCEPTED' || trade.status === 'DISPUTED') && (isProposer || isReceiver) && (
          <section className="mt-5 space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black uppercase text-[#1D3160]">{t('trades.shippingTitle')}</h2>
            {!me?.shipped_at && trade.status === 'ACCEPTED' && (
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <input value={carrier} onChange={(event) => setCarrier(event.target.value)} placeholder={t('trades.carrier')} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
                <input value={tracking} onChange={(event) => setTracking(event.target.value)} placeholder={t('trades.tracking')} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" />
                <button disabled={busy} onClick={() => void perform(() => ship.mutateAsync({ tradeId, tracking_carrier: carrier || undefined, tracking_code: tracking || undefined }))} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1D3160] px-4 text-sm font-bold text-white disabled:opacity-40">
                  <Truck className="h-4 w-4" /> {t('trades.markShipped')}
                </button>
              </div>
            )}
            {other?.shipped_at && !me?.receipt_confirmed_at && trade.status === 'ACCEPTED' && (
              <button disabled={busy} onClick={() => void perform(() => confirmReceipt.mutateAsync(tradeId))} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40">
                <PackageCheck className="h-4 w-4" /> {t('trades.confirmReceipt')}
              </button>
            )}
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              {!me?.cancel_requested_at && !other?.cancel_requested_at && trade.status === 'ACCEPTED' && (
                <button disabled={busy} onClick={() => void perform(() => requestCancel.mutateAsync(tradeId))} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-40">
                  {t('trades.requestCancel')}
                </button>
              )}
              {other?.cancel_requested_at && (
                <button disabled={busy} onClick={() => void perform(() => confirmCancel.mutateAsync(tradeId))} className="rounded-full border border-red-200 px-4 py-2 text-xs font-bold text-red-700 disabled:opacity-40">
                  {t('trades.confirmCancel')}
                </button>
              )}
            </div>
            <div className="flex gap-2 border-t border-slate-100 pt-4">
              <input value={assistanceReason} onChange={(event) => setAssistanceReason(event.target.value)} placeholder={t('trades.assistanceReason')} className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm" />
              <button disabled={busy || !assistanceReason.trim()} onClick={() => void perform(() => assistance.mutateAsync({ tradeId, reason: assistanceReason.trim() }))} className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-bold text-white disabled:opacity-40">
                <ShieldAlert className="h-4 w-4" /> {t('trades.assistance')}
              </button>
            </div>
          </section>
        )}

        {busy && <p className="mt-4 text-sm font-medium text-slate-500">{t('trades.saving')}</p>}
        {actionError && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
      </div>
    </div>
  );
}
