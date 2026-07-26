'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowLeftRight, Check, ExternalLink, Loader2, PackageCheck, ShieldAlert, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import {
  TRADE_CARRIERS,
  tradeCarrierLabel,
  tradeTrackingUrl,
  type TradeCarrierId,
} from '@/lib/shipping/trade-carriers';
import { ScambiShell, TradeCardThumb, scambiGlass, scambiGlassLight } from './ScambiShell';

const EMPTY_ADDRESS: TradeAddress = {
  full_name: '', street: '', city: '', zip: '', province: '', country: 'IT', phone: '',
};

function statusKey(status: TradeStatus) {
  return `trades.status.${status}` as const;
}

function ItemList({ title, items, catalog, tone }: {
  title: string;
  items: TradeItem[];
  catalog: Record<number, { name?: string; image?: string | null; set_name?: string }>;
  tone: 'give' | 'receive';
}) {
  const { t } = useTranslation();
  const cardCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <section className={cn(scambiGlassLight, 'overflow-hidden rounded-[1.5rem]')}>
      <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className={cn('h-8 w-1 rounded-full', tone === 'give' ? 'bg-[#1D3160]' : 'bg-[#FF7300]')} aria-hidden />
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">{tone === 'give' ? t('trades.offered') : t('trades.requested')}</p>
            <h2 className="mt-0.5 text-sm font-black text-[#1D3160]">{title}</h2>
          </div>
        </div>
        <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-black', tone === 'give' ? 'bg-slate-100 text-slate-500' : 'bg-orange-50 text-[#E86600]')}>{t('trades.cardsCount', { count: cardCount })}</span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="mx-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-slate-50/70 p-2.5 transition-colors duration-200 first:mt-3 last:mb-3 hover:border-orange-100 hover:bg-white sm:mx-4">
            <div className="flex min-w-0 items-center gap-3">
              <TradeCardThumb
                image={catalog[item.blueprint_id]?.image}
                name={catalog[item.blueprint_id]?.name || t('trades.cardFallback', { id: item.blueprint_id })}
                className="h-[58px] w-[42px] shrink-0"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-800">
                  {catalog[item.blueprint_id]?.name || item.description || t('trades.cardFallback', { id: item.blueprint_id })}
                </p>
                <p className="truncate text-xs text-slate-400">{catalog[item.blueprint_id]?.set_name || `#${item.inventory_item_id ?? item.blueprint_id}`}</p>
              </div>
            </div>
            <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs font-black text-white', tone === 'give' ? 'bg-[#1D3160]' : 'bg-[#FF7300]')}>
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
  const field = (
    key: keyof TradeAddress,
    label: string,
    required = false,
    autoComplete?: string,
    inputMode?: 'numeric' | 'tel',
  ) => (
    <label className="text-xs font-bold text-slate-600">
      {label}
      <input
        required={required}
        value={value[key] ?? ''}
        onChange={(event) => onChange({ ...value, [key]: event.target.value })}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#FF7300] focus:ring-2 focus:ring-[#FF7300]/15"
      />
    </label>
  );
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {field('full_name', t('trades.address.fullName'), true, 'name')}
      {field('street', t('trades.address.street'), true, 'street-address')}
      {field('city', t('trades.address.city'), true, 'address-level2')}
      {field('zip', t('trades.address.zip'), true, 'postal-code', 'numeric')}
      {field('province', t('trades.address.province'), false, 'address-level1')}
      {field('country', t('trades.address.country'), true, 'country-name')}
      {field('phone', t('trades.address.phone'), false, 'tel', 'tel')}
    </div>
  );
}

function TrackingSummary({
  title,
  carrier,
  code,
  linkLabel,
  otherCarrierLabel,
}: {
  title: string;
  carrier: string | null;
  code: string | null;
  linkLabel: string;
  otherCarrierLabel: string;
}) {
  if (!code) return null;
  const url = tradeTrackingUrl(carrier, code);
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
      <p className="text-xs font-black uppercase text-[#1D3160]">{title}</p>
      <p className="mt-1 break-all text-sm font-semibold text-slate-700">
        {tradeCarrierLabel(carrier, otherCarrierLabel)} · {code}
      </p>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#FF7300] hover:underline"
        >
          {linkLabel} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      )}
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
  const [carrier, setCarrier] = useState<TradeCarrierId | ''>('');
  const [tracking, setTracking] = useState('');
  const [assistanceReason, setAssistanceReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'decline' | 'cancel' | null>(null);

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
    return (
      <ScambiShell>
        <div className="flex min-h-[60vh] items-center justify-center" role="status">
          <Loader2 className="h-7 w-7 animate-spin text-[#FF7300]" aria-label={t('trades.loading')} />
        </div>
      </ScambiShell>
    );
  }
  if (query.isError) {
    return (
      <ScambiShell>
        <div className="container-content flex min-h-[65vh] items-center justify-center py-12">
          <div className={cn(scambiGlass, 'flex max-w-md flex-col items-center rounded-[2rem] p-8 text-center')} role="alert">
            <h1 className="text-xl font-black uppercase text-white">{t('trades.loadError')}</h1>
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="mt-6 rounded-full bg-white px-5 py-2.5 text-sm font-black text-[#1D3160] transition-colors hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A26]/70"
            >
              {t('trades.retry')}
            </button>
          </div>
        </div>
      </ScambiShell>
    );
  }
  if (!trade || !Number.isInteger(tradeId)) {
    return (
      <ScambiShell>
        <div className="container-content flex min-h-[65vh] items-center justify-center py-12">
          <div className={cn(scambiGlass, 'flex max-w-md flex-col items-center rounded-[2rem] p-8 text-center')}>
            <h1 className="mt-5 text-xl font-black uppercase text-white">{t('trades.notFound')}</h1>
            <Link href="/scambi" className="mt-6 rounded-full bg-white px-5 py-2.5 text-sm font-black text-[#1D3160]">{t('trades.back')}</Link>
          </div>
        </div>
      </ScambiShell>
    );
  }

  const offered = trade.items.filter((item) => item.direction === 'offered');
  const requested = trade.items.filter((item) => item.direction === 'requested');
  const isProposer = user?.id === trade.proposer_id;
  const isReceiver = user?.id === trade.receiver_id;
  const otherName = (isProposer ? trade.receiver_display_name : trade.proposer_display_name) || t('trades.user');
  const me = trade.parties?.find((party) => party.user_id === user?.id);
  const other = trade.parties?.find((party) => party.user_id !== user?.id);
  const anyShipped = Boolean(me?.shipped_at || other?.shipped_at);
  const validAddress = Boolean(address.full_name && address.street && address.city && address.zip && address.country);

  const perform = async (operation: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await operation();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : t('trades.actionError'));
    }
  };

  const submitShipment = () => {
    const code = tracking.trim();
    if (!carrier || code.length < 3) return;
    void perform(() => ship.mutateAsync({
      tradeId,
      tracking_carrier: carrier,
      tracking_code: code,
    }));
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
        blueprintId: first.blueprint_id,
        id: String(first.blueprint_id),
        name: catalog[first.blueprint_id]?.name || t('trades.cardFallback', { id: first.blueprint_id }),
        image: catalog[first.blueprint_id]?.image ?? '',
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

  const endedBeforeShipping = ['DECLINED', 'CANCELLED', 'EXPIRED', 'COUNTERED'].includes(trade.status);
  const phaseLabels = endedBeforeShipping
    ? [t('trades.status.PROPOSED'), t(statusKey(trade.status))]
    : [t('trades.status.PROPOSED'), t('trades.status.ACCEPTED'), t('trades.status.COMPLETED')];
  const activePhase = endedBeforeShipping
    ? 1
    : trade.status === 'COMPLETED'
      ? 2
      : trade.status === 'ACCEPTED' || trade.status === 'DISPUTED'
        ? 1
        : 0;
  const transitioning = busy || trade.status === 'ACCEPTING';

  return (
    <ScambiShell>
      <div className="container-content mx-auto max-w-6xl pb-20 pt-6 md:pt-9">
        <Link href="/scambi" className="mb-4 inline-flex items-center gap-2 rounded-lg text-sm font-bold text-white/60 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-white/40">
          <ArrowLeft className="h-4 w-4" aria-hidden /> {t('trades.back')}
        </Link>

        <header className={cn(scambiGlass, 'relative mb-5 animate-in overflow-hidden rounded-[1.8rem] p-5 text-white fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none sm:p-7')}>
          {transitioning && <span className="scambi-busy-track absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-white/10" aria-hidden />}
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-200/70">{t('trades.tradeNumber', { id: trade.id })}</p>
                <span className="h-1 w-1 rounded-full bg-white/25" aria-hidden />
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">{t('trades.withUser', { user: otherName })}</p>
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{t(statusKey(trade.status))}</h1>
              <p className="mt-2 text-sm text-white/55">{t('trades.exchangeSummary', { offered: offered.reduce((sum, item) => sum + item.quantity, 0), requested: requested.reduce((sum, item) => sum + item.quantity, 0) })}</p>
            </div>

            <div className="flex items-center overflow-hidden rounded-2xl border border-white/10 bg-black/10 p-1.5">
              {phaseLabels.map((label, index) => {
                const done = index < activePhase;
                const active = index === activePhase;
                return (
                  <div key={label} className={cn('flex min-w-0 items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors sm:min-w-32', active && 'bg-white text-[#1D3160] shadow-md')}>
                    <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-black', done ? 'bg-emerald-400 text-[#0D2B27]' : active ? 'bg-[#FF7300] text-white' : 'bg-white/10 text-white/35')}>
                      {done ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> : `0${index + 1}`}
                    </span>
                    <span className={cn('hidden truncate text-[9px] font-black uppercase tracking-wide sm:block', active ? 'text-[#1D3160]' : 'text-white/50')}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="relative mt-5 h-1 overflow-hidden rounded-full bg-white/10" aria-hidden>
            <span
              className={cn(
                'relative block h-full rounded-full bg-gradient-to-r from-[#FF8A26] to-[#FF7300] transition-[width] duration-700 ease-out motion-reduce:transition-none',
                transitioning && 'scambi-busy-track overflow-hidden',
                endedBeforeShipping && 'from-white/45 to-white/25',
              )}
              style={{ width: `${((activePhase + 1) / phaseLabels.length) * 100}%` }}
            />
          </div>
          {trade.message && <p className="relative mt-5 max-w-3xl break-words rounded-xl border border-white/10 bg-white/[0.055] p-3.5 text-sm leading-relaxed text-white/70">“{trade.message}”</p>}
        </header>

        <div className="relative grid animate-in items-start gap-3 fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none md:grid-cols-[minmax(0,1fr)_44px_minmax(0,1fr)]">
          <ItemList
            title={isProposer ? t('trades.youOffer') : t('trades.youReceive')}
            items={offered}
            catalog={catalog}
            tone={isProposer ? 'give' : 'receive'}
          />
          <div className="z-10 flex h-11 w-11 items-center justify-center justify-self-center rounded-full border border-orange-200 bg-white text-[#FF7300] shadow-lg md:mt-10" aria-hidden>
            <ArrowLeftRight className="h-5 w-5" />
          </div>
          <ItemList
            title={isProposer ? t('trades.youReceive') : t('trades.youOffer')}
            items={requested}
            catalog={catalog}
            tone={isProposer ? 'receive' : 'give'}
          />
        </div>

        {trade.status === 'PROPOSED' && isReceiver && (
          <form
            className={cn(scambiGlassLight, 'mt-5 animate-in rounded-[1.5rem] p-5 fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none sm:p-6')}
            onSubmit={(event) => {
              event.preventDefault();
              if (validAddress && !busy) void perform(() => accept.mutateAsync({ tradeId, address }));
            }}
          >
            <div className="mb-5 border-b border-slate-100 pb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">{t('trades.status.PROPOSED')}</p>
              <h2 className="mt-1 text-lg font-black text-[#1D3160]">{t('trades.acceptTitle')}</h2>
              <p className="mt-1 text-xs text-slate-500">{t('trades.shippingNote')}</p>
            </div>
            <AddressFields value={address} onChange={setAddress} />
            <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
              <button type="submit" disabled={busy || !validAddress} className="order-first rounded-xl bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-md shadow-emerald-600/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-500 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 disabled:translate-y-0 disabled:opacity-40 motion-reduce:transform-none sm:order-last sm:ml-auto">
                {t('trades.accept')}
              </button>
              <button type="button" disabled={busy} onClick={startCounter} className="rounded-xl border border-[#1D3160]/15 bg-[#1D3160]/5 px-5 py-3 text-sm font-bold text-[#1D3160] transition-colors duration-200 hover:bg-[#1D3160]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D3160]/30 disabled:opacity-40">
                {t('trades.counter')}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (confirmAction === 'decline') void perform(() => decline.mutateAsync({ tradeId }));
                  else setConfirmAction('decline');
                }}
                className={cn(
                  'rounded-xl border px-5 py-3 text-sm font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-40',
                  confirmAction === 'decline' ? 'border-red-700 bg-red-700 text-white hover:bg-red-600' : 'border-red-200 bg-white text-red-700 hover:bg-red-50',
                )}
              >
                {confirmAction === 'decline' ? t('trades.confirmDecline') : t('trades.decline')}
              </button>
              {confirmAction === 'decline' && (
                <button type="button" onClick={() => setConfirmAction(null)} className="rounded-xl px-3 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300">
                  {t('common.cancel')}
                </button>
              )}
            </div>
          </form>
        )}

        {trade.status === 'PROPOSED' && isProposer && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (confirmAction === 'cancel') void perform(() => cancel.mutateAsync({ tradeId }));
                else setConfirmAction('cancel');
              }}
              className={cn(
                'rounded-xl border px-5 py-2.5 text-sm font-bold shadow-sm backdrop-blur-xl transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-40',
                confirmAction === 'cancel' ? 'border-red-700 bg-red-700 text-white hover:bg-red-600' : 'border-red-200 bg-white/90 text-red-700 hover:bg-red-50',
              )}
            >
              {confirmAction === 'cancel' ? t('trades.confirmCancelProposal') : t('trades.cancelProposal')}
            </button>
            {confirmAction === 'cancel' && (
              <button type="button" onClick={() => setConfirmAction(null)} className="rounded-xl bg-white/10 px-3 py-2.5 text-sm font-bold text-white/70 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
                {t('common.cancel')}
              </button>
            )}
          </div>
        )}

        {(trade.status === 'ACCEPTED' || trade.status === 'DISPUTED') && (isProposer || isReceiver) && (
          <section className={cn(scambiGlassLight, 'mt-4 animate-in space-y-4 rounded-[1.4rem] p-5 fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none')}>
            <h2 className="text-sm font-black uppercase text-[#1D3160]">{t('trades.shippingTitle')}</h2>
            {!me?.shipped_at && trade.status === 'ACCEPTED' && (
              <form
                className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitShipment();
                }}
              >
                <select
                  value={carrier}
                  onChange={(event) => setCarrier(event.target.value as TradeCarrierId | '')}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-[#FF7300]"
                  aria-label={t('trades.carrier')}
                >
                  <option value="">{t('trades.selectCarrier')}</option>
                  {TRADE_CARRIERS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.id === 'other' ? t('trades.carrierOther') : option.label}
                    </option>
                  ))}
                </select>
                <input value={tracking} onChange={(event) => setTracking(event.target.value)} placeholder={t('trades.tracking')} aria-label={t('trades.tracking')} autoComplete="off" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-[#FF7300] focus:ring-2 focus:ring-[#FF7300]/15" />
                <button type="submit" disabled={busy || !carrier || tracking.trim().length < 3} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D3160] px-4 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#29457f] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D3160]/35 disabled:translate-y-0 disabled:opacity-40 motion-reduce:transform-none">
                  <Truck className="h-4 w-4" aria-hidden /> {t('trades.markShipped')}
                </button>
              </form>
            )}
            {(me?.tracking_code || other?.tracking_code) && (
              <div className="grid gap-3 sm:grid-cols-2">
                <TrackingSummary title={t('trades.yourShipment')} carrier={me?.tracking_carrier ?? null} code={me?.tracking_code ?? null} linkLabel={t('trades.trackShipment')} otherCarrierLabel={t('trades.carrierOther')} />
                <TrackingSummary title={t('trades.otherShipment')} carrier={other?.tracking_carrier ?? null} code={other?.tracking_code ?? null} linkLabel={t('trades.trackShipment')} otherCarrierLabel={t('trades.carrierOther')} />
              </div>
            )}
            {other?.shipped_at && !me?.receipt_confirmed_at && trade.status === 'ACCEPTED' && (
              <button type="button" disabled={busy} onClick={() => void perform(() => confirmReceipt.mutateAsync(tradeId))} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-500 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 disabled:translate-y-0 disabled:opacity-40 motion-reduce:transform-none">
                <PackageCheck className="h-4 w-4" aria-hidden /> {t('trades.confirmReceipt')}
              </button>
            )}
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              {!anyShipped && !me?.cancel_requested_at && !other?.cancel_requested_at && trade.status === 'ACCEPTED' && (
                <button type="button" disabled={busy} onClick={() => void perform(() => requestCancel.mutateAsync(tradeId))} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:opacity-40">
                  {t('trades.requestCancel')}
                </button>
              )}
              {!anyShipped && other?.cancel_requested_at && (
                <button type="button" disabled={busy} onClick={() => void perform(() => confirmCancel.mutateAsync(tradeId))} className="rounded-full border border-red-200 px-4 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-40">
                  {t('trades.confirmCancel')}
                </button>
              )}
            </div>
            <div className="border-t border-slate-100 pt-4">
              {trade.status === 'ACCEPTED' ? (
                <>
                  <p className="mb-2 text-xs text-slate-500">{t('trades.assistanceHelp')}</p>
                  <form
                    className="flex flex-col gap-2 sm:flex-row"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const reason = assistanceReason.trim();
                      if (reason.length >= 3 && !busy) void perform(() => assistance.mutateAsync({ tradeId, reason }));
                    }}
                  >
                    <input value={assistanceReason} onChange={(event) => setAssistanceReason(event.target.value)} placeholder={t('trades.assistanceReason')} aria-label={t('trades.assistanceReason')} className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15" />
                    <button type="submit" disabled={busy || assistanceReason.trim().length < 3} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-bold text-white transition-colors hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 disabled:opacity-40">
                      <ShieldAlert className="h-4 w-4" aria-hidden /> {t('trades.assistance')}
                    </button>
                  </form>
                </>
              ) : (
                <p className="text-sm font-semibold text-amber-700">{t('trades.disputeOpen')}</p>
              )}
            </div>
          </section>
        )}

        {transitioning && <p className="mt-4 text-sm font-medium text-white/65" role="status">{t(trade.status === 'ACCEPTING' ? 'trades.accepting' : 'trades.saving')}</p>}
        {actionError && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{actionError}</p>}
      </div>
    </ScambiShell>
  );
}
