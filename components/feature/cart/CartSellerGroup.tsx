'use client';

import Link from 'next/link';
import { Package } from 'lucide-react';
import { CartLineItem } from '@/components/feature/cart/CartLineItem';
import { CartSellerBadge } from '@/components/feature/cart/CartSellerBadge';
import { formatEuroNoSpace } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { CartSellerGroup as CartSellerGroupData } from '@/lib/marketplace/cart-groups';
import type { MarketplaceCartLine } from '@/types';

type CartSellerGroupProps = {
  group: CartSellerGroupData;
  intlLocale: string;
  onUpdateQuantity: (lineId: string, quantity: number) => void;
  onRemove: (lineId: string) => void;
};

function sellerInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
}

export function CartSellerGroupCard({
  group,
  intlLocale,
  onUpdateQuantity,
  onRemove,
}: CartSellerGroupProps) {
  const { t } = useTranslation();
  const subtotal = group.subtotalCents / 100;
  const profileHref = `/users/${encodeURIComponent(group.sellerDisplayName)}`;

  const itemsLabel =
    group.unitCount === 1
      ? t('cart.sellerItemsOne', { count: group.unitCount })
      : t('cart.sellerItems', { count: group.unitCount });

  return (
    <section
      className="overflow-hidden rounded-3xl border border-white/60 bg-white/55 shadow-[0_8px_32px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.04] backdrop-blur-2xl backdrop-saturate-150"
      aria-labelledby={`seller-${group.sellerId}`}
    >
      <header className="flex flex-col gap-3 border-b border-black/[0.06] bg-gradient-to-b from-white/80 to-white/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-600 text-sm font-bold text-white shadow-md"
            aria-hidden
          >
            {sellerInitial(group.sellerDisplayName)}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-widest text-neutral-500">
              {t('cart.sellerGroup')}
            </p>
            <h2
              id={`seller-${group.sellerId}`}
              className="truncate text-lg font-semibold tracking-tight text-neutral-900"
            >
              <Link
                href={profileHref}
                className="transition-colors hover:text-primary"
              >
                {group.sellerDisplayName}
              </Link>
            </h2>
            <p className="text-xs text-neutral-500">{itemsLabel}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <CartSellerBadge accountType={group.sellerAccountType} />
        </div>
      </header>

      <div className="px-4 sm:px-6">
        {group.items.map((item: MarketplaceCartLine) => (
          <CartLineItem
            key={item.lineId}
            item={item}
            intlLocale={intlLocale}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemove}
          />
        ))}
      </div>

      <footer className="flex items-center justify-between gap-4 border-t border-black/[0.06] bg-neutral-50/50 px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <Package className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{t('cart.shippingNote')}</span>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
            {t('cart.subtotal')}
          </p>
          <p className="text-base font-semibold tabular-nums tracking-tight text-neutral-900">
            {formatEuroNoSpace(subtotal, intlLocale)}
          </p>
        </div>
      </footer>
    </section>
  );
}
