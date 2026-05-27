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
    pill: 'bg-[#E8E8ED] text-[#3C3C43]/80 ring-[#D1D1D6]',
    dot: 'bg-[#8E8E93]',
    ring: 'ring-[#D1D1D6]/60',
  },
  ready_to_ship: {
    icon: Package,
    pill: 'bg-[#FFF4EC] text-[#C45A00] ring-[#FF7300]/25',
    dot: 'bg-[#FF7300]',
    ring: 'ring-[#FF7300]/30',
  },
  in_transit: {
    icon: Truck,
    pill: 'bg-[#EEF4FF] text-[#1D3160] ring-[#1D3160]/15',
    dot: 'bg-[#1D3160]',
    ring: 'ring-[#1D3160]/25',
  },
  delivered: {
    icon: PackageCheck,
    pill: 'bg-[#E8F8EE] text-[#1B7F42] ring-[#34C759]/20',
    dot: 'bg-[#34C759]',
    ring: 'ring-[#34C759]/25',
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

function statusLabelKey(status: ShippingOrderStatus): string {
  const map: Record<ShippingOrderStatus, string> = {
    processing: 'auctions.shippingStatusProcessing',
    ready_to_ship: 'auctions.shippingStatusReady',
    in_transit: 'auctions.shippingStatusTransit',
    delivered: 'auctions.shippingStatusDelivered',
  };
  return map[status];
}

function tabLabelKey(tab: StatusFilter): string {
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
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-[#6E6E73] transition hover:bg-black/[0.04] hover:text-[#1D3160]"
      aria-label={t('auctions.shippingCopyTracking')}
    >
      {copied ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5 text-[#34C759]" aria-hidden />
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
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const meta = STATUS_META[order.status];
  const StatusIcon = meta.icon;

  return (
    <article
      id={`order-${order.id}`}
      className={cn(
        'group relative overflow-hidden rounded-[1.35rem] border border-white/60 bg-white/70 shadow-[0_2px_24px_rgba(0,0,0,0.06)] backdrop-blur-xl backdrop-saturate-150 transition duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)]',
        highlight && 'ring-2 ring-[#FF7300]/50 ring-offset-2 ring-offset-[#F5F5F7]'
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-[#FF7300]/8 to-transparent blur-2xl" aria-hidden />

      <div className="flex flex-col lg:flex-row">
        {/* Card image */}
        <div className="relative shrink-0 border-b border-black/[0.04] p-4 sm:p-5 lg:w-[11.5rem] lg:border-b-0 lg:border-r xl:w-[12.5rem]">
          <div className="relative mx-auto aspect-[5/7] w-full max-w-[9.5rem] overflow-hidden rounded-2xl bg-[#F5F5F7] shadow-[0_4px_20px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.06]">
            <Image
              src={order.image}
              alt={order.title}
              fill
              className="object-cover transition duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 1024px) 152px, 168px"
            />
          </div>
          <span className="absolute left-7 top-7 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#1D3160] shadow-sm backdrop-blur-md ring-1 ring-black/[0.06]">
            {order.condition}
          </span>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 p-4 sm:p-5 lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#FF7300]">
                {t('auctions.shippingAuctionId')} · #{order.auctionId.toUpperCase()}
              </p>
              <h2 className="text-[1.125rem] font-semibold leading-snug tracking-tight text-[#1D1D1F] sm:text-[1.25rem]">
                {order.cardName}
              </h2>
              <p className="text-[13px] text-[#6E6E73]">{order.expansion}</p>
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide ring-1',
                meta.pill
              )}
            >
              <StatusIcon className="h-3.5 w-3.5" aria-hidden />
              {t(statusLabelKey(order.status))}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {/* Auction section */}
            <section className="rounded-2xl border border-black/[0.04] bg-white/50 p-4 backdrop-blur-sm">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#86868B]">
                {t('auctions.shippingSectionAuction')}
              </h3>
              <dl className="mt-3 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[12px] text-[#6E6E73]">{t('auctions.shippingFinalPrice')}</dt>
                  <dd className="text-[15px] font-semibold tabular-nums text-[#FF7300]">{fmtEur(order.finalPriceEur)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[12px] text-[#6E6E73]">{t('auctions.shippingClosedAt')}</dt>
                  <dd className="text-right text-[12px] font-medium text-[#1D1D1F]">{fmtClosedDate(order.auctionClosedAt)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[12px] text-[#6E6E73]">{t('auctions.shippingBuyer')}</dt>
                  <dd className="flex items-center gap-1.5 text-[12px] font-medium text-[#1D1D1F]">
                    <FlagIcon country={order.buyerCountry} size="sm" />
                    <span>{order.buyerUsername}</span>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[12px] text-[#6E6E73]">{t('auctions.shippingCondition')}</dt>
                  <dd className="text-[12px] font-medium text-[#1D1D1F]">{order.conditionLabel}</dd>
                </div>
              </dl>
            </section>

            {/* Shipping section */}
            <section className="rounded-2xl border border-black/[0.04] bg-white/50 p-4 backdrop-blur-sm">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#86868B]">
                {t('auctions.shippingSectionShipping')}
              </h3>
              <dl className="mt-3 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[12px] text-[#6E6E73]">{t('auctions.shippingOrderLabel')}</dt>
                  <dd className="font-mono text-[12px] font-medium text-[#1D1D1F]">{order.id}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[12px] text-[#6E6E73]">{t('auctions.shippingCourier')}</dt>
                  <dd className="text-[12px] font-medium text-[#1D1D1F]">
                    {order.courier ?? t('auctions.shippingCourierPending')}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="shrink-0 text-[12px] text-[#6E6E73]">{t('auctions.shippingTracking')}</dt>
                  <dd className="text-right">
                    {order.trackingCode ? (
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="font-mono text-[12px] font-medium text-[#1D3160]">{order.trackingCode}</span>
                        <CopyTrackingButton code={order.trackingCode} />
                      </div>
                    ) : (
                      <span className="text-[12px] text-[#86868B]">{t('auctions.shippingTrackingPending')}</span>
                    )}
                  </dd>
                </div>
              </dl>
            </section>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-black/[0.04] pt-4">
            <Link
              href={auctionDetailPath(order.auctionId)}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white/80 px-4 py-2 text-[13px] font-medium text-[#1D1D1F] shadow-sm backdrop-blur-sm transition hover:border-[#FF7300]/40 hover:text-[#FF7300]"
            >
              {t('auctions.shippingViewAuction')}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
            {order.status === 'ready_to_ship' && (
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-2 rounded-full bg-[#FF7300] px-5 py-2 text-[13px] font-semibold text-white opacity-60 shadow-[0_4px_14px_rgba(255,115,0,0.25)]"
              >
                <Truck className="h-4 w-4" aria-hidden />
                {t('auctions.shippingAddTracking')}
              </button>
            )}
            {order.trackingCode && order.status === 'in_transit' && (
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-2 rounded-full border border-[#1D3160]/15 bg-[#EEF4FF] px-4 py-2 text-[13px] font-medium text-[#1D3160] opacity-70"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                {t('auctions.shippingTrackPackage')}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function AsteShippingPage() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const searchParams = useSearchParams();
  const highlightOrderId = searchParams.get('order');

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

  const highlightStatus = useMemo(
    () => rows.find((r) => r.id === highlightOrderId)?.status ?? null,
    [rows, highlightOrderId]
  );

  const [activeTab, setActiveTab] = useState<StatusFilter>('all');

  useEffect(() => {
    if (highlightStatus) setActiveTab(highlightStatus);
  }, [highlightStatus]);

  useEffect(() => {
    if (!highlightOrderId || typeof document === 'undefined') return;
    const el = document.getElementById(`order-${highlightOrderId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightOrderId, activeTab]);

  const filteredRows = useMemo(
    () => (activeTab === 'all' ? rows : rows.filter((r) => r.status === activeTab)),
    [rows, activeTab]
  );

  const tabs: StatusFilter[] = ['all', ...SHIPPING_STATUS_ORDER];

  if (!isAuthenticated) {
    return (
      <div className="container-content py-16">
        <div className="mx-auto max-w-lg rounded-[1.35rem] border border-white/60 bg-white/80 p-10 text-center shadow-[0_8px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl">
          <h1 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">{t('auctions.loginRequiredTitle')}</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#6E6E73]">{t('auctions.loginRequiredBody')}</p>
          <Link href="/login" className="btn-orange-glow mt-6 inline-flex rounded-full px-8 py-3">
            {t('auth.login')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F5F5F7] pb-20 pt-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-32 top-24 h-72 w-72 rounded-full bg-[#FF7300]/[0.06] blur-3xl" />
        <div className="absolute -right-24 top-64 h-80 w-80 rounded-full bg-[#1D3160]/[0.05] blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#34C759]/[0.04] blur-3xl" />
      </div>

      <AsteNav />

      <div className="container-content relative">
        <AppBreadcrumb
          items={breadcrumbItems}
          ariaLabel="Breadcrumb"
          variant="default"
          className="mb-4 w-auto text-sm"
        />

        <header className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-[1.75rem] font-semibold tracking-tight text-[#1D1D1F] sm:text-[2rem]">
                {t('auctions.shippingPageTitle')}
              </h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#6E6E73]">
                {t('auctions.shippingPageSubtitle')}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-2 text-[13px] font-medium text-[#6E6E73] shadow-sm backdrop-blur-md">
              <Package className="h-4 w-4 text-[#FF7300]" aria-hidden />
              {t('auctions.shippingTotalCount', { count: rows.length })}
            </div>
          </div>
        </header>

        {/* Status summary pills */}
        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:gap-3">
          {SHIPPING_STATUS_ORDER.map((status) => {
            const meta = STATUS_META[status];
            const Icon = meta.icon;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setActiveTab(status)}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border border-white/60 bg-white/55 p-3.5 text-left shadow-[0_2px_16px_rgba(0,0,0,0.04)] backdrop-blur-xl transition hover:bg-white/75 sm:p-4',
                  activeTab === status && cn('ring-2 ring-offset-2 ring-offset-[#F5F5F7]', meta.ring)
                )}
              >
                <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl ring-1', meta.pill)}>
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span>
                  <span className="block text-[1.25rem] font-semibold tabular-nums leading-none text-[#1D1D1F]">
                    {counts[status]}
                  </span>
                  <span className="mt-1 block text-[11px] font-medium text-[#86868B]">{t(statusLabelKey(status))}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Segmented tabs */}
        <div
          className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-white/60 bg-white/45 p-1 shadow-[0_2px_16px_rgba(0,0,0,0.04)] backdrop-blur-xl scrollbar-hide"
          role="tablist"
          aria-label={t('auctions.shippingTabListLabel')}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition',
                activeTab === tab
                  ? 'bg-white text-[#1D1D1F] shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                  : 'text-[#6E6E73] hover:bg-white/50 hover:text-[#1D1D1F]'
              )}
            >
              {t(tabLabelKey(tab))}
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] tabular-nums',
                  activeTab === tab ? 'bg-[#F5F5F7] text-[#6E6E73]' : 'bg-black/[0.04] text-[#86868B]'
                )}
              >
                {counts[tab]}
              </span>
            </button>
          ))}
        </div>

        {filteredRows.length === 0 ? (
          <div className="rounded-[1.35rem] border border-white/60 bg-white/60 p-14 text-center shadow-[0_2px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl">
            <Package className="mx-auto h-10 w-10 text-[#C7C7CC]" aria-hidden />
            <p className="mt-4 text-[15px] font-medium text-[#1D1D1F]">{t('auctions.shippingEmptyTab')}</p>
            <p className="mt-1 text-[13px] text-[#86868B]">{t('auctions.shippingEmptyTabHint')}</p>
          </div>
        ) : (
          <ul className="space-y-4 sm:space-y-5">
            {filteredRows.map((order) => (
              <li key={order.id}>
                <ShippingCard order={order} highlight={highlightOrderId === order.id} t={t} />
              </li>
            ))}
          </ul>
        )}

        <p className="mt-8 text-center text-[12px] text-[#86868B]">{t('auctions.shippingMockHint')}</p>
      </div>
    </div>
  );
}
