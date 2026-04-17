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
        'w-full py-2.5 font-sans md:py-4',
        useUnifiedBackground
          ? 'bg-transparent text-slate-100'
          : "bg-[#F1F5F9] bg-[linear-gradient(rgba(241,245,249,0.8),rgba(241,245,249,0.8)),url('/brx-sfondo-logo-tile.svg')] bg-[length:100%_100%,162px_162px] bg-repeat"
      )}
    >
      <div className="container-content px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          {features.map(({ titleKey, Icon }) => (
            <div
              key={titleKey}
              className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 sm:gap-2.5 sm:px-4 sm:py-2.5"
              style={{ backgroundColor: 'rgba(255, 115, 0, 0.15)' }}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" style={{ color: ORANGE }} strokeWidth={2} />
              <span
                className={cn(
                  'text-[11px] font-medium uppercase leading-tight tracking-tight sm:text-[13px] lg:text-sm',
                  useUnifiedBackground ? 'text-slate-100' : 'text-gray-800'
                )}
              >
                {t(titleKey)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
