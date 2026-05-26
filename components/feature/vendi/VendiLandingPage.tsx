'use client';

import { Home } from 'lucide-react';
import { AppBreadcrumb } from '@/components/ui/AppBreadcrumb';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { VENDI_CATEGORIES } from '@/lib/vendi/vendi-categories';
import { ListingMethodCard } from './ListingMethodCard';

export function VendiLandingPage() {
  const { t } = useTranslation();

  const breadcrumbItems = [
    {
      href: '/',
      label: t('breadcrumb.home'),
      icon: <Home className="h-4 w-4" aria-hidden />,
      iconOnly: true,
      ariaLabel: t('breadcrumb.home'),
      isCurrent: false,
    },
    { href: '/account/oggetti', label: t('vendi.breadcrumb.stock'), isCurrent: false },
    { label: t('vendi.pageTitle'), isCurrent: true },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="container-content py-6 lg:py-10">
        <AppBreadcrumb
          items={breadcrumbItems}
          ariaLabel={t('vendi.breadcrumbAria')}
          variant="default"
          className="mb-5 w-auto text-sm"
        />

        <header className="mb-12 border-b border-gray-200 pb-8 text-center">
          <h1 className="text-3xl font-bold text-[#1D3160] sm:text-4xl">{t('vendi.pageTitle')}</h1>
        </header>

        <div className="mx-auto flex max-w-[1280px] flex-wrap items-stretch justify-center gap-8 px-2 sm:gap-10 lg:gap-12">
          {VENDI_CATEGORIES.map((category) => (
            <ListingMethodCard
              key={category.id}
              href={category.href}
              imageSrc={category.imageSrc}
              imageAlt={t(category.titleKey)}
              title={t(category.titleKey)}
              size="large"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
