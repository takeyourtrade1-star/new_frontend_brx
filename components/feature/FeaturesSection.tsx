'use client';

import { useMemo } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { BadgeDollarSign, Truck, ShieldCheck, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const ORANGE = '#FF7300';

export function FeaturesSection({ useUnifiedBackground = false }: { useUnifiedBackground?: boolean } = {}) {
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
    <section
      className={cn(
        'w-full py-3 font-sans md:py-5',
        useUnifiedBackground
          ? 'bg-transparent'
          : "bg-[#F1F5F9] bg-[linear-gradient(rgba(241,245,249,0.8),rgba(241,245,249,0.8)),url('/brx-sfondo-logo-tile.svg')] bg-[length:100%_100%,162px_162px] bg-repeat"
      )}
    >
      <div className="container-content px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {features.map(({ titleKey, Icon }) => (
            <div
              key={titleKey}
              className="group inline-flex w-fit items-center gap-2 rounded-full border border-[#FF7300]/25 bg-white px-3 py-2 shadow-[0_2px_8px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.04)] sm:gap-2.5 sm:px-4 sm:py-2.5 transition-all duration-300 hover:shadow-[0_4px_16px_rgba(15,23,42,0.1)] hover:border-[#FF7300]/50"
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" style={{ color: ORANGE }} strokeWidth={2} />
              <span className="text-[11px] font-semibold uppercase leading-tight tracking-tight sm:text-[13px] lg:text-sm text-slate-700">
                {t(titleKey)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

