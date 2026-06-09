'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { isSellFlow } from '@/lib/sell-flow/sell-flow';
import { VENDI_OBJECT_CATEGORIES } from '@/lib/vendi/vendi-object-categories';
import { ListingMethodCard } from './ListingMethodCard';
import { VendiPageShell, vendiBaseBreadcrumbItems } from './VendiPageShell';

export function SellObjectsContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const sellFlow = isSellFlow(searchParams);
  const breadcrumbItems = vendiBaseBreadcrumbItems(t, t('vendi.category.products'), { sellFlow });

  return (
    <VendiPageShell
      title={t('vendi.products.pageTitle')}
      subtitle={t('vendi.products.chooseType')}
      breadcrumbItems={breadcrumbItems}
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 px-2 max-w-[1400px] mx-auto">
        {VENDI_OBJECT_CATEGORIES.map((category) => (
          <ListingMethodCard
            key={category.id}
            href={category.href}
            imageSrc={category.imageSrc}
            imageAlt={t(category.titleKey)}
            title={t(category.titleKey)}
            size="large"
            background={category.style?.background}
            glowColor={category.style?.glowColor}
              imagePosition={category.style?.imagePosition}
              fullCard={category.fullCard}
          />
        ))}
      </div>
    </VendiPageShell>
  );
}
