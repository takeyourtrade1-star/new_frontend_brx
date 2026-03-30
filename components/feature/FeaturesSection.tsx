'use client';

import { useMemo } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { BadgeDollarSign, Truck, ShieldCheck, Users } from 'lucide-react';

const ORANGE = '#FF7300';

export function FeaturesSection() {
  const { t } = useTranslation();

  const features = useMemo(
    () =>
      [
        { titleKey: 'gameHome.features.bestPrices' as const, Icon: BadgeDollarSign },
        { titleKey: 'gameHome.features.fastShipping' as const, Icon: Truck },
        { titleKey: 'gameHome.features.buyerProtection' as const, Icon: ShieldCheck },
        { titleKey: 'gameHome.features.communityGuided' as const, Icon: Users },
      ] as const,
    []
  );

  return (
    <section className="w-full bg-white bg-[url('/brx-sfondo-logo-tile.svg')] bg-[length:162px_162px] bg-repeat py-3 font-sans text-gray-900 md:py-4">
      <div className="container-content px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-x-2 gap-y-4 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          {features.map(({ titleKey, Icon }) => (
            <div
              key={titleKey}
              className="group flex items-center gap-2 sm:gap-3.5 rounded-xl px-2 py-2 sm:px-3 sm:py-3 transition-colors hover:bg-orange-50/50"
            >
              <div
                className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full transition-colors"
                style={{ backgroundColor: 'rgba(255, 115, 0, 0.1)' }}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: ORANGE }} strokeWidth={2} />
              </div>
              <span className="text-[11px] font-medium uppercase tracking-tight text-gray-800 leading-tight sm:text-[13px] lg:text-sm">
                {t(titleKey)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
