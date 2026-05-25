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
      <div className="flex flex-wrap justify-center gap-6 sm:gap-8 lg:justify-start lg:gap-10">
        {VENDI_OBJECT_CATEGORIES.map((category) => (
          <ListingMethodCard
            key={category.id}
            href={category.href}
            imageSrc={category.imageSrc}
            imageAlt={t(category.titleKey)}
            title={t(category.titleKey)}
          />
        ))}
      </div>
    </VendiPageShell>
  );
}
