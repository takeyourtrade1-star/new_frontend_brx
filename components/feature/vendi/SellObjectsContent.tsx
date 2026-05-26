'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';
import { VENDI_OBJECT_CATEGORIES } from '@/lib/vendi/vendi-object-categories';
import { ListingMethodCard } from './ListingMethodCard';
import { VendiPageShell, vendiBaseBreadcrumbItems } from './VendiPageShell';

export function SellObjectsContent() {
  const { t } = useTranslation();
  const breadcrumbItems = vendiBaseBreadcrumbItems(t, t('vendi.category.products'));

  return (
    <VendiPageShell
      title={t('vendi.products.pageTitle')}
      subtitle={t('vendi.products.chooseType')}
      breadcrumbItems={breadcrumbItems}
    >
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-stretch justify-center gap-8 px-2 sm:gap-10 lg:gap-12">
        {VENDI_OBJECT_CATEGORIES.map((category) => (
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
    </VendiPageShell>
  );
}
