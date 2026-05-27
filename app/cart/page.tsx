'use client';

import { Suspense, useMemo, useState, useCallback } from 'react';
import { useCartStore } from '@/lib/stores/cart-store';
import { Header } from '@/components/layout/Header';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useGame } from '@/lib/contexts/GameContext';
import { useAuthStore } from '@/lib/stores/auth-store';
import { syncClient } from '@/lib/api/sync-client';
import { purchaseListing, MarketplaceApiError } from '@/lib/api/marketplace-client';
import { LOCALE_TO_INTL } from '@/lib/i18n/locales';
import type { UiLocale } from '@/lib/i18n/locales';
import type { MarketplaceCartLine } from '@/types';
import { groupCartItemsBySeller } from '@/lib/marketplace/cart-groups';
import { useCartSellerProfiles } from '@/components/feature/cart/use-cart-seller-profiles';
import { CartSellerGroupCard } from '@/components/feature/cart/CartSellerGroup';
import { CartOrderSummary } from '@/components/feature/cart/CartOrderSummary';
import { CartEmptyState } from '@/components/feature/cart/CartEmptyState';

type CheckoutLineError = { lineId: string; title: string; message: string };

export default function CartPage() {
  const { t, locale } = useTranslation();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const getTotal = useCartStore((s) => s.getTotal);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [checkoutErrors, setCheckoutErrors] = useState<CheckoutLineError[]>([]);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

  const { resolveDisplayName, resolveAccountType } = useCartSellerProfiles(items);

  const sellerGroups = useMemo(
    () => groupCartItemsBySeller(items, resolveDisplayName, resolveAccountType),
    [items, resolveDisplayName, resolveAccountType],
  );

  const itemCount = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity, 0),
    [items],
  );
  const cartTotal = getTotal();
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

  const purchaseLine = useCallback(
    async (line: MarketplaceCartLine, token: string): Promise<void> => {
      if (line.source === 'sync') {
        const res = await syncClient.purchaseInventoryItem(
          line.sellerId,
          Number(line.listingId),
          { quantity: line.quantity },
          token,
        );
        if (res.status !== 'success') {
          throw new Error(res.message || res.error || 'Acquisto non completato');
        }
        return;
      }

      await purchaseListing({
        listing_id: String(line.listingId),
        quantity: line.quantity,
        idempotency_key: crypto.randomUUID(),
      });
    },
    [],
  );

  const handleCheckout = useCallback(async () => {
    if (!user?.id || !accessToken) {
      setCheckoutErrors([
        { lineId: '_auth', title: t('cart.title'), message: 'Accedi per completare l\'acquisto.' },
      ]);
      return;
    }

    setCheckoutSubmitting(true);
    setCheckoutErrors([]);
    const errors: CheckoutLineError[] = [];
    const succeeded: string[] = [];

    for (const line of items) {
      try {
        await purchaseLine(line, accessToken);
        succeeded.push(line.lineId);
      } catch (e) {
        const message =
          e instanceof MarketplaceApiError
            ? e.detail
            : e instanceof Error
              ? e.message
              : 'Errore durante l\'acquisto';
        errors.push({ lineId: line.lineId, title: line.title, message });
      }
    }

    if (succeeded.length > 0) {
      succeeded.forEach((lineId) => removeItem(lineId));
    }
    setCheckoutErrors(errors);
    setCheckoutSubmitting(false);
  }, [user?.id, accessToken, items, purchaseLine, removeItem, t]);

  const continueHref = getGameHomeLink();

  return (
    <div className="min-h-screen bg-[#f5f5f7] font-sans text-neutral-900">
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
              {sellerGroups.length === 1
                ? t('cart.sellersOne')
                : t('cart.sellers', { count: sellerGroups.length })}
              {' · '}
              {itemCount === 1
                ? t('cart.itemsOne', { count: itemCount })
                : t('cart.items', { count: itemCount })}
            </p>
          )}
        </header>

        {itemCount === 0 ? (
          <CartEmptyState continueShoppingHref={continueHref} />
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:gap-10 xl:gap-12">
            <div className="min-w-0 space-y-5">
              {sellerGroups.map((group) => (
                <CartSellerGroupCard
                  key={group.sellerId}
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
            />
          </div>
        )}
      </main>
    </div>
  );
}
