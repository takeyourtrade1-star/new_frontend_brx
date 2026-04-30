'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { AuctionCreateWizard } from '@/components/feature/aste/create/AuctionCreateWizard';
import { AsteNav } from '@/components/feature/aste/AsteNav';
import { AppBreadcrumb, type AppBreadcrumbItem } from '@/components/ui/AppBreadcrumb';

export function AuctionCreatePage() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const breadcrumbItems: AppBreadcrumbItem[] = [
    { href: '/', label: t('auctions.breadcrumbHome'), isCurrent: false },
    { href: '/aste', label: t('pages.auctions.title'), isCurrent: false },
    { label: t('auctions.createPageTitle'), isCurrent: true },
  ];

  if (!isAuthenticated) {
    return (
      <div className="container-content py-16">
        <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-xl font-bold uppercase tracking-wide text-gray-900">{t('auctions.loginRequiredTitle')}</h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">{t('auctions.loginRequiredBody')}</p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-full bg-[#FF7300] px-8 py-3 text-sm font-bold uppercase text-white transition hover:bg-[#e86800]"
          >
            {t('auth.login')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f5f5] pb-4 pt-6">
      <AsteNav />
      <div className="container-content">
        <AppBreadcrumb
          items={breadcrumbItems}
          ariaLabel="Breadcrumb"
          variant="default"
          className="mb-6 w-auto text-sm"
        />
        <div className="mb-8 max-w-3xl">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-[#1D3160] md:text-3xl">{t('auctions.createPageTitle')}</h1>
        </div>
        <AuctionCreateWizard />
      </div>
    </div>
  );
}
