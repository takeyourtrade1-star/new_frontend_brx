'use client';

import { Suspense, useMemo, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/stores/cart-store';
import { useMockPurchaseStore } from '@/lib/stores/mock-purchase-store';
import { Header } from '@/components/layout/Header';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useGame } from '@/lib/contexts/GameContext';
import { useAuthStore } from '@/lib/stores/auth-store';
import { LOCALE_TO_INTL } from '@/lib/i18n/locales';
import type { UiLocale } from '@/lib/i18n/locales';
import {
  getCartSellerCount,
  groupCartItemsBySeller,
} from '@/lib/marketplace/cart-groups';
import { useCartSellerProfiles } from '@/components/feature/cart/use-cart-seller-profiles';
import { CartSellerGroupCard } from '@/components/feature/cart/CartSellerGroup';
import { CartOrderSummary } from '@/components/feature/cart/CartOrderSummary';
import { CartEmptyState } from '@/components/feature/cart/CartEmptyState';
import { CartStickyCheckout } from '@/components/feature/cart/CartStickyCheckout';

type CheckoutLineError = { lineId: string; title: string; message: string };

export default function CartPage() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const createFromCartLines = useMockPurchaseStore((s) => s.createFromCartLines);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [checkoutErrors, setCheckoutErrors] = useState<CheckoutLineError[]>([]);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const checkoutAnchorRef = useRef<HTMLDivElement>(null);

  const { resolveDisplayName, resolveAccountType } = useCartSellerProfiles(items);

  const sellerGroups = useMemo(
    () => groupCartItemsBySeller(items, resolveDisplayName, resolveAccountType),
    [items, resolveDisplayName, resolveAccountType],
  );
  const sellerCount = getCartSellerCount(sellerGroups);
  const hasBrxExpress = sellerGroups.some((group) => group.kind === 'brx-express');

  const itemCount = useMemo(
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
  const { selectedGame } = useGame();
  const intlLocale = LOCALE_TO_INTL[locale as UiLocale] ?? 'it-IT';

  const getGameHomeLink = () => {
    switch (selectedGame) {
      case 'mtg':
        return '/home/magic';
      case 'pokemon':
        return '/home/pokemon';
      default:
        return '/home';
    }
  };

  const handleCheckout = useCallback(async () => {
    if (!user?.id || !accessToken) {
      setCheckoutErrors([
        { lineId: '_auth', title: t('cart.title'), message: t('cart.loginRequired') },
      ]);
      return;
    }

    if (items.length === 0) return;

    setCheckoutSubmitting(true);
    setCheckoutErrors([]);

    const lineIds = items.map((line) => line.lineId);
    createFromCartLines(items, 'cart');
    lineIds.forEach((lineId) => removeItem(lineId));

    setCheckoutSubmitting(false);
    router.push('/ordini/acquisti?tab=da-pagare');
  }, [user?.id, accessToken, items, createFromCartLines, removeItem, router, t]);

  const continueHref = getGameHomeLink();

  return (
    <div className="min-h-screen bg-[#f5f5f7] font-sans text-neutral-900">
      <noscript>
        <p className="bg-amber-100 px-4 py-3 text-center text-sm text-amber-900">
          Questo sito richiede JavaScript per funzionare. Attiva JavaScript nel
          browser per usare il carrello.
        </p>
      </noscript>
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        <header className="mb-8 md:mb-10">
          <h1 className="font-display text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
            {t('cart.title')}
          </h1>
          {itemCount > 0 && (
            <p className="mt-2 text-sm text-neutral-500">
              {sellerCount > 0 &&
                (sellerCount === 1
                  ? t('cart.sellersOne')
                  : t('cart.sellers', { count: sellerCount }))}
              {sellerCount > 0 && hasBrxExpress && ' + '}
              {hasBrxExpress && t('cart.brxExpress')}
              {' · '}
              {itemCount === 1
                ? t('cart.itemsOne', { count: itemCount })
                : t('cart.items', { count: itemCount })}
            </p>
          )}
        </header>

        {itemCount > 0 && (
          <div
            className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/90 px-4 py-3 text-sm text-blue-900 sm:px-5"
            role="note"
          >
            <span className="mr-2 inline-flex rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              DEMO
            </span>
            {t('cart.demoBanner')}
          </div>
        )}

        {itemCount === 0 ? (
          <CartEmptyState continueShoppingHref={continueHref} />
        ) : (
          <>
          <div className="grid grid-cols-1 gap-8 pb-24 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:gap-10 lg:pb-0 xl:gap-12">
            <div className="min-w-0 space-y-5">
              {sellerGroups.map((group) => (
                <CartSellerGroupCard
                  key={group.id}
                  group={group}
                  intlLocale={intlLocale}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>

            <CartOrderSummary
              groups={sellerGroups}
              cartTotal={cartTotal}
              itemCount={itemCount}
              intlLocale={intlLocale}
              continueShoppingHref={continueHref}
              checkoutErrors={checkoutErrors}
              checkoutSubmitting={checkoutSubmitting}
              onCheckout={() => void handleCheckout()}
              onClearCart={clearCart}
              checkoutAnchorRef={checkoutAnchorRef}
            />
          </div>

          <CartStickyCheckout
            checkoutAnchorRef={checkoutAnchorRef}
            cartTotal={cartTotal}
            intlLocale={intlLocale}
            checkoutSubmitting={checkoutSubmitting}
            onCheckout={() => void handleCheckout()}
          />
          </>
        )}
      </main>
    </div>
  );
}
