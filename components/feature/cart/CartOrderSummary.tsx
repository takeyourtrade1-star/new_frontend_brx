'use client';

import type { RefObject } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatEuroNoSpace } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { CartSellerGroup } from '@/lib/marketplace/cart-groups';

type CheckoutLineError = { lineId: string; title: string; message: string };

type CartOrderSummaryProps = {
  groups: CartSellerGroup[];
  cartTotal: number;
  itemCount: number;
  intlLocale: string;
  continueShoppingHref: string;
  checkoutErrors: CheckoutLineError[];
  checkoutSubmitting: boolean;
  onCheckout: () => void;
  onClearCart: () => void;
  checkoutAnchorRef?: RefObject<HTMLDivElement | null>;
};

export function CartOrderSummary({
  groups,
  cartTotal,
  itemCount,
  intlLocale,
  continueShoppingHref,
  checkoutErrors,
  checkoutSubmitting,
  onCheckout,
  onClearCart,
  checkoutAnchorRef,
}: CartOrderSummaryProps) {
  const { t } = useTranslation();
  const sellerCount = groups.length;

  const sellersLabel =
    sellerCount === 1
      ? t('cart.sellersOne')
      : t('cart.sellers', { count: sellerCount });

  const itemsLabel =
    itemCount === 1
      ? t('cart.itemsOne', { count: itemCount })
      : t('cart.items', { count: itemCount });

  return (
    <aside className="lg:sticky lg:top-28 lg:self-start">
      <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/70 shadow-[0_12px_40px_rgba(15,23,42,0.08)] ring-1 ring-black/[0.05] backdrop-blur-2xl backdrop-saturate-150">
        <div className="border-b border-black/[0.06] px-5 py-5 sm:px-6">
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
            {t('cart.orderSummary')}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">{itemsLabel}</p>
        </div>

        <div className="space-y-3 px-5 py-4 sm:px-6">
          {groups.map((group) => (
            <div
              key={group.sellerId}
              className="flex items-start justify-between gap-3 text-sm"
            >
              <span className="min-w-0 truncate text-neutral-600">
                {group.sellerDisplayName}
              </span>
              <span className="shrink-0 font-medium tabular-nums text-neutral-900">
                {formatEuroNoSpace(group.subtotalCents / 100, intlLocale)}
              </span>
            </div>
          ))}

          <div className="flex items-center justify-between border-t border-dashed border-black/10 pt-3 text-xs text-neutral-500">
            <span>{sellersLabel}</span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              {t('cart.secureCheckout')}
            </span>
          </div>
        </div>

        <div className="border-t border-black/[0.06] bg-neutral-50/60 px-5 py-4 sm:px-6">
          <div className="mb-4 flex items-baseline justify-between">
            <span className="text-sm font-medium text-neutral-600">{t('cart.total')}</span>
            <span className="text-2xl font-bold tracking-tight tabular-nums text-neutral-900">
              {formatEuroNoSpace(cartTotal, intlLocale)}
            </span>
          </div>

          {checkoutErrors.length > 0 && (
            <div
              className="mb-4 space-y-2 rounded-2xl border border-red-200/80 bg-red-50/90 px-3 py-2.5 text-sm text-red-800"
              role="alert"
            >
              {checkoutErrors.map((err) => (
                <p key={err.lineId}>
                  <span className="font-semibold">{err.title}:</span> {err.message}
                </p>
              ))}
            </div>
          )}

          <div ref={checkoutAnchorRef}>
            <Button
              type="button"
              disabled={checkoutSubmitting}
              onClick={onCheckout}
              className="h-12 w-full rounded-2xl border-0 bg-primary text-base font-semibold text-white shadow-[0_4px_14px_rgba(255,115,0,0.35)] transition hover:opacity-95 disabled:opacity-60"
            >
            {checkoutSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('cart.checkout')}
              </>
            ) : (
              t('cart.checkout')
            )}
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={onClearCart}
            className="mt-2 h-10 w-full rounded-xl text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          >
            {t('cart.clear')}
          </Button>

          <Button
            asChild
            variant="ghost"
            className="mt-1 h-10 w-full rounded-xl text-sm text-neutral-600 hover:bg-neutral-100"
          >
            <Link href={continueShoppingHref}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('cart.continueShopping')}
            </Link>
          </Button>
        </div>
      </div>
    </aside>
  );
}
