'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/lib/stores/cart-store';
import { useCartBadgeBounce } from '@/lib/hooks/use-cart-badge-bounce';
import { cn, formatEuroNoSpace } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { LOCALE_TO_INTL } from '@/lib/i18n/locales';
import type { UiLocale } from '@/lib/i18n/locales';

export function FloatingCartFab() {
  const pathname = usePathname();
  const { t, locale } = useTranslation();
  const items = useCartStore((s) => s.items);
  const cartCount = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity, 0),
    [items],
  );
  const cartTotal = useMemo(
    () =>
      items.reduce(
        (acc, item) => acc + (item.priceCents / 100) * item.quantity,
        0,
      ),
    [items],
  );
  const badgeBounce = useCartBadgeBounce(cartCount);
  const intlLocale = LOCALE_TO_INTL[locale as UiLocale] ?? 'it-IT';

  // Nascondi il FAB carrello sul carrello stesso e nella pagina "I miei oggetti":
  // lì la barra azioni mobile (ricerca/filtri) sta in basso e il FAB la coprirebbe.
  // Nascosto anche nella sezione aste: lì si compra tramite offerte, non col carrello,
  // e il FAB coprirebbe le barre fisse in basso (filtri hub, dock offerta nel dettaglio).
  // Stesso motivo negli scambi: non si usa il carrello e la barra step (Continua/
  // Indietro) della controproposta sta fissa in basso.
  if (
    pathname === '/cart' ||
    pathname === '/account/oggetti' ||
    pathname === '/aste' ||
    pathname.startsWith('/aste/') ||
    pathname === '/scambi' ||
    pathname.startsWith('/scambi/')
  ) {
    return null;
  }

  return (
    <Link
      href="/cart"
      data-cart-icon="true"
      className={cn(
        'fixed right-5 z-[9990] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-[0_4px_20px_rgba(255,115,0,0.45)] md:hidden',
        'transition-transform active:scale-95 hover:brightness-110',
        'bottom-[max(1.25rem,env(safe-area-inset-bottom))]',
      )}
      aria-label={t('nav.cartAria', { total: formatEuroNoSpace(cartTotal, intlLocale) })}
    >
      <ShoppingCart className="h-6 w-6" strokeWidth={2} aria-hidden />
      {cartCount > 0 ? (
        <span
          className={cn(
            'absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-primary',
            badgeBounce && 'animate-cart-badge-bounce',
          )}
          aria-hidden
        >
          {cartCount > 99 ? '99+' : cartCount}
        </span>
      ) : null}
    </Link>
  );
}
