'use client';

import { useEffect, useState, type RefObject } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatEuroNoSpace } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';

type CartStickyCheckoutProps = {
  /** Ref sul pulsante checkout nel riepilogo — la barra si nasconde quando è visibile. */
  checkoutAnchorRef: RefObject<HTMLElement | null>;
  cartTotal: number;
  intlLocale: string;
  checkoutSubmitting: boolean;
  onCheckout: () => void;
};

export function CartStickyCheckout({
  checkoutAnchorRef,
  cartTotal,
  intlLocale,
  checkoutSubmitting,
  onCheckout,
}: CartStickyCheckoutProps) {
  const { t } = useTranslation();
  const [anchorVisible, setAnchorVisible] = useState(false);

  useEffect(() => {
    const el = checkoutAnchorRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setAnchorVisible(entry.isIntersecting),
      {
        threshold: 0.2,
        rootMargin: '0px 0px -12px 0px',
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [checkoutAnchorRef]);

  const showBar = !anchorVisible;

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 lg:hidden',
        'border-t border-black/[0.08] bg-white/85 shadow-[0_-12px_40px_rgba(15,23,42,0.14)]',
        'backdrop-blur-2xl backdrop-saturate-150',
        'transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
        showBar
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-full opacity-0',
      )}
      aria-hidden={!showBar}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
            {t('cart.total')}
          </p>
          <p className="text-xl font-bold tabular-nums tracking-tight text-neutral-900">
            {formatEuroNoSpace(cartTotal, intlLocale)}
          </p>
        </div>

        <Button
          type="button"
          disabled={checkoutSubmitting}
          onClick={onCheckout}
          className="h-12 shrink-0 rounded-2xl border-0 bg-primary px-6 text-base font-semibold text-white shadow-[0_4px_14px_rgba(255,115,0,0.35)] hover:opacity-95 disabled:opacity-60"
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
    </div>
  );
}
