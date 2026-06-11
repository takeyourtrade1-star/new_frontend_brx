'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  Package,
  PackageCheck,
  Truck,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { MessageKey } from '@/lib/i18n/messages/en';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { useAuthStore } from '@/lib/stores/auth-store';
import { auctionDetailPath } from '@/lib/auction/auction-paths';
import {
  MOCK_SHIPPING_ORDERS,
  SHIPPING_STATUS_ORDER,
  type ShippingOrderMock,
  type ShippingOrderStatus,
} from '@/components/feature/aste/mock-auction-shipping';
import { AsteNav } from '@/components/feature/aste/AsteNav';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';
import { cn } from '@/lib/utils';
import { ExpandableCard } from '@/components/shared/ExpandableCard';

type StatusFilter = 'all' | ShippingOrderStatus;

const STATUS_META: Record<
  ShippingOrderStatus,
  {
    icon: typeof Package;
    pill: string;
    dot: string;
    ring: string;
  }
> = {
  processing: {
    icon: Clock3,
    pill: 'bg-gray-100 text-gray-700 ring-gray-200/50',
    dot: 'bg-gray-400',
    ring: 'ring-gray-200/55',
  },
  ready_to_ship: {
    icon: Package,
    pill: 'bg-amber-50 text-amber-700 ring-amber-200/50',
    dot: 'bg-amber-500',
    ring: 'ring-amber-200/55',
  },
  in_transit: {
    icon: Truck,
    pill: 'bg-blue-50 text-blue-700 ring-blue-200/50',
    dot: 'bg-blue-500',
    ring: 'ring-blue-200/55',
  },
  delivered: {
    icon: PackageCheck,
    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200/50',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-200/55',
  },
};

function fmtEur(n: number) {
  return n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
}

function fmtClosedDate(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusLabelKey(status: ShippingOrderStatus): MessageKey {
  const map: Record<ShippingOrderStatus, MessageKey> = {
    processing: 'auctions.shippingStatusProcessing',
    ready_to_ship: 'auctions.shippingStatusReady',
    in_transit: 'auctions.shippingStatusTransit',
    delivered: 'auctions.shippingStatusDelivered',
  };
  return map[status];
}

function tabLabelKey(tab: StatusFilter): MessageKey {
  if (tab === 'all') return 'auctions.shippingTabAll';
  return statusLabelKey(tab);
}

function CopyTrackingButton({ code }: { code: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [code]);

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-gray-500 transition hover:bg-black/[0.04] hover:text-[#FF7300]"
      aria-label={t('auctions.shippingCopyTracking')}
    >
      {copied ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
          {t('auctions.shippingCopied')}
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" aria-hidden />
          {t('auctions.shippingCopyTracking')}
        </>
      )}
    </button>
  );
}

function ShippingCard({
  order,
  highlight,
  t,
}: {
  order: ShippingOrderMock;
  highlight: boolean;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
}) {
  const meta = STATUS_META[order.status];
  const StatusIcon = meta.icon;

  const summary = (
    <div className="flex items-start gap-3">
      {/* Immagine della carta */}
      <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-[#F5F4F0] ring-1 ring-black/5">
        <Image
          src={order.image}
          alt={order.cardName}
          fill
          className="object-cover"
          sizes="40px"
        />
      </div>

      {/* Contenuto descrittivo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {order.cardName}
          </h3>
          <span className="text-sm font-bold text-gray-900 shrink-0">
            {fmtEur(order.finalPriceEur)}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-gray-500 truncate">
          {order.expansion} · Condizione: <span className="font-semibold">{order.condition}</span>
        </p>

        {/* Status pill e tag Asta */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1',
                meta.pill
              )}
            >
              <StatusIcon className="h-3 w-3" aria-hidden />
              {t(statusLabelKey(order.status))}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
              Acquirente: {order.buyerUsername}
            </span>
          </div>
          <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500">
            Asta
          </span>
        </div>
      </div>
    </div>
  );

  const details = (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Dettagli Asta */}
        <section className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
            {t('auctions.shippingSectionAuction')}
          </h4>
          <dl className="mt-2.5 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-500">{t('auctions.shippingAuctionId')}</dt>
              <dd className="font-semibold text-gray-900">#{order.auctionId.toUpperCase()}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-500">{t('auctions.shippingClosedAt')}</dt>
              <dd className="font-medium text-gray-900">{fmtClosedDate(order.auctionClosedAt)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-500">{t('auctions.shippingBuyer')}</dt>
              <dd className="flex items-center gap-1 text-gray-900 font-medium">
                <FlagIcon country={order.buyerCountry} size="sm" />
                <span>{order.buyerUsername}</span>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-500">{t('auctions.shippingCondition')}</dt>
              <dd className="font-medium text-gray-900">{order.conditionLabel}</dd>
            </div>
          </dl>
        </section>

        {/* Dettagli Spedizione */}
        <section className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
            {t('auctions.shippingSectionShipping')}
          </h4>
          <dl className="mt-2.5 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-500">{t('auctions.shippingOrderLabel')}</dt>
              <dd className="font-mono text-gray-900">{order.id}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-500">{t('auctions.shippingCourier')}</dt>
              <dd className="font-medium text-gray-900">
                {order.courier ?? t('auctions.shippingCourierPending')}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="shrink-0 text-gray-500">{t('auctions.shippingTracking')}</dt>
              <dd className="text-right">
                {order.trackingCode ? (
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-mono text-gray-900 font-medium">{order.trackingCode}</span>
                    <CopyTrackingButton code={order.trackingCode} />
                  </div>
                ) : (
                  <span className="text-gray-400">{t('auctions.shippingTrackingPending')}</span>
                )}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Bottoni Azioni */}
      <div className="flex flex-wrap items-center gap-2 border-t border-gray-150 pt-3">
        <Link
          href={auctionDetailPath(order.auctionId)}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-gray-700 shadow-sm transition hover:border-[#FF7300]/40 hover:text-[#FF7300]"
        >
          {t('auctions.shippingViewAuction')}
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        {order.status === 'ready_to_ship' && (
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-full bg-[#FF7300] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white opacity-60 shadow-[0_4px_14px_rgba(255,115,0,0.25)]"
          >
            <Truck className="h-4 w-4" aria-hidden />
            {t('auctions.shippingAddTracking')}
          </button>
        )}
        {order.trackingCode && order.status === 'in_transit' && (
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-blue-700 opacity-70"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            {t('auctions.shippingTrackPackage')}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className={cn(highlight && 'ring-2 ring-[#FF7300]/50 ring-offset-2 ring-offset-[#F5F4F0] rounded-xl overflow-hidden')}>
      <ExpandableCard summary={summary} details={details} />
    </div>
  );
}

export function AsteShippingPage() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const searchParams = useSearchParams();
  const orderQuery = searchParams.get('order');

  const breadcrumbItems: AppBreadcrumbItem[] = [
    { href: '/', label: t('auctions.breadcrumbHome'), isCurrent: false },
    { href: '/aste', label: t('pages.auctions.title'), isCurrent: false },
    { label: t('auctions.shippingPageTitle'), isCurrent: true },
  ];

  const rows = useMemo(() => MOCK_SHIPPING_ORDERS, []);

  const counts = useMemo(() => {
    const base: Record<StatusFilter, number> = {
      all: rows.length,
      processing: 0,
      ready_to_ship: 0,
      in_transit: 0,
      delivered: 0,
    };
    for (const row of rows) {
      base[row.status] += 1;
    }
    return base;
  }, [rows]);

  const highlightOrder = useMemo(
    () =>
      orderQuery
        ? rows.find((r) => r.id === orderQuery || r.auctionId === orderQuery) ?? null
        : null,
    [rows, orderQuery]
  );

  const highlightStatus = highlightOrder?.status ?? null;

  const [activeTab, setActiveTab] = useState<StatusFilter>('all');

  useEffect(() => {
    if (highlightStatus) setActiveTab(highlightStatus);
  }, [highlightStatus]);

  useEffect(() => {
    if (!highlightOrder || typeof document === 'undefined') return;
    const el = document.getElementById(`order-${highlightOrder.id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightOrder, activeTab]);

  const filteredRows = useMemo(
    () => (activeTab === 'all' ? rows : rows.filter((r) => r.status === activeTab)),
    [rows, activeTab]
  );

  const tabs: StatusFilter[] = ['all', ...SHIPPING_STATUS_ORDER];

  if (!isAuthenticated) {
    return (
      <div className="container-content py-16">
        <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">{t('auctions.loginRequiredTitle')}</h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">{t('auctions.loginRequiredBody')}</p>
          <Link href="/login" className="btn-orange-glow mt-6 inline-flex rounded-full px-8 py-3">
            {t('auth.login')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full font-sans pb-20 pt-6" style={{ backgroundColor: '#F5F4F0' }}>
      <AsteNav />

      <div className="container-content relative">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <AppBreadcrumb
            items={breadcrumbItems}
            ariaLabel="Breadcrumb"
            variant="default"
            className="w-auto text-sm"
          />
          <Link
            href="/aiuto"
            className="text-sm font-medium text-[#FF7300] hover:underline"
          >
            HAI BISOGNO DI AIUTO?
          </Link>
        </div>

        <h1 className="mb-2 text-2xl font-bold uppercase tracking-wide text-gray-900 sm:text-3xl">
          {t('auctions.shippingPageTitle')}
        </h1>
        <p className="mb-6 text-sm text-gray-600">
          {t('auctions.shippingPageSubtitle')}
        </p>

        {/* Tab controlli */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-x-2 gap-y-2 border-b border-gray-200 pb-3">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors flex items-center gap-2',
                  activeTab === tab
                    ? 'bg-[#FF7300] text-white shadow-sm'
                    : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-gray-900',
                )}
              >
                {t(tabLabelKey(tab))}
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] tabular-nums font-bold',
                    activeTab === tab ? 'bg-white/20 text-white' : 'bg-black/[0.04] text-gray-500'
                  )}
                >
                  {counts[tab]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-14 text-center shadow-sm">
            <Package className="mx-auto h-10 w-10 text-gray-400" aria-hidden />
            <p className="mt-4 text-[15px] font-medium text-gray-900">{t('auctions.shippingEmptyTab')}</p>
            <p className="mt-1 text-[13px] text-gray-500">{t('auctions.shippingEmptyTabHint')}</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {filteredRows.map((order) => (
              <li key={order.id} id={`order-${order.id}`}>
                <ShippingCard order={order} highlight={highlightOrder?.id === order.id} t={t} />
              </li>
            ))}
          </ul>
        )}

        <p className="mt-8 text-center text-[12px] text-gray-500">{t('auctions.shippingMockHint')}</p>
      </div>
    </div>
  );
}
