'use client';

import { Store, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CartSellerAccountType } from '@/types';
import { useTranslation } from '@/lib/i18n/useTranslation';

type CartSellerBadgeProps = {
  accountType: CartSellerAccountType | null;
  className?: string;
};

export function CartSellerBadge({ accountType, className }: CartSellerBadgeProps) {
  const { t } = useTranslation();
  const isBusiness = accountType === 'business';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
        isBusiness
          ? 'bg-amber-500/12 text-amber-800 ring-1 ring-amber-500/25'
          : 'bg-neutral-500/10 text-neutral-600 ring-1 ring-neutral-400/20',
        className,
      )}
    >
      {isBusiness ? (
        <>
          <Store className="h-3 w-3" aria-hidden />
          {t('cart.sellerBusiness')}
        </>
      ) : (
        <>
          <User className="h-3 w-3" aria-hidden />
          {t('cart.sellerPersonal')}
        </>
      )}
    </span>
  );
}
