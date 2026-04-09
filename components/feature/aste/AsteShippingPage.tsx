'use client';

import { useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Package, Truck } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { useAuthStore } from '@/lib/stores/auth-store';
import { auctionDetailPath } from '@/lib/auction/auction-paths';
import { MOCK_SHIPPING_ORDERS } from '@/components/feature/aste/mock-auction-shipping';
import { AsteNav } from '@/components/feature/aste/AsteNav';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';

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

  useEffect(() => {
    if (!highlightOrderId || typeof document === 'undefined') return;
    const el = document.getElementById(`order-${highlightOrderId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightOrderId]);

  const rows = useMemo(() => MOCK_SHIPPING_ORDERS, []);

  if (!isAuthenticated) {
    return (
      <div className="container-content py-16">
        <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-xl font-bold uppercase tracking-wide text-gray-900">{t('auctions.loginRequiredTitle')}</h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">{t('auctions.loginRequiredBody')}</p>
          <Link
            href="/login"
            className="btn-orange-glow mt-6 inline-flex rounded-full px-8 py-3"
          >
            {t('auth.login')}
          </Link>
        </div>
      </div>
    );
  }

  const fmtEur = (n: number) => n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });

  return (
    <div className="min-h-screen bg-white pb-16 pt-6">
      <AsteNav />
      <div className="container-content">
        <AppBreadcrumb
          items={breadcrumbItems}
          ariaLabel="Breadcrumb"
          variant="default"
          className="mb-4 w-auto text-sm"
        />

        <header className="mb-8 border-b border-gray-200 pb-6">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-gray-900 md:text-3xl">
            {t('auctions.shippingPageTitle')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">{t('auctions.shippingPageSubtitle')}</p>
        </header>

        {rows.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-12 text-center text-gray-600">
            {t('auctions.shippingEmpty')}
          </div>
        ) : (
          <ul className="space-y-4">
            {rows.map((o) => {
              const highlight = highlightOrderId === o.id;
              return (
                <li
                  key={o.id}
                  id={`order-${o.id}`}
                  className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
                    highlight ? 'border-[#FF7300] ring-2 ring-[#FF7300]/30' : 'border-gray-200'
                  }`}
                >
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch">
                    <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 sm:h-48 sm:w-36">
                      <Image src={o.image} alt="" fill className="object-cover" sizes="144px" unoptimized />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-[#FF7300]">{t('auctions.shippingOrderLabel')}</p>
                          <h2 className="mt-1 text-lg font-bold text-gray-900">{o.title}</h2>
                          <p className="mt-1 text-sm text-gray-600">
                            {t('auctions.shippingBuyer')}:{' '}
                            <FlagIcon country={o.buyerCountry} size="md" />{' '}
                            <span className="font-semibold text-gray-900">{o.buyerUsername}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold uppercase text-gray-500">{t('auctions.shippingFinalPrice')}</p>
                          <p className="text-xl font-bold text-[#FF7300]">{fmtEur(o.finalPriceEur)}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-900">
                          <Package className="h-3.5 w-3.5" aria-hidden />
                          {t('auctions.shippingStatusAwaiting')}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link
                          href={auctionDetailPath(o.auctionId)}
                          className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-[#FF7300] hover:text-[#FF7300]"
                        >
                          {t('auctions.shippingViewAuction')}
                        </Link>
                        <button
                          type="button"
                          disabled
                          className="inline-flex items-center gap-2 rounded-full bg-[#FF7300] px-5 py-2 text-sm font-bold uppercase tracking-wide text-white opacity-50"
                        >
                          <Truck className="h-4 w-4" aria-hidden />
                          {t('auctions.shippingAddTracking')}
                        </button>
                      </div>
                      <p className="mt-3 text-xs text-gray-500">{t('auctions.shippingMockHint')}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
