'use client';

import { Suspense, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/lib/stores/cart-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { Loader2, ShoppingBag } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useGame } from '@/lib/contexts/GameContext';
import { useAuthStore } from '@/lib/stores/auth-store';
import { syncClient } from '@/lib/api/sync-client';
import { purchaseListing, MarketplaceApiError } from '@/lib/api/marketplace-client';
import { formatEuroNoSpace } from '@/lib/utils';
import { getCdnImageUrl } from '@/lib/config';
import { ListingCartPhoto, isMarketplaceListingUuid } from '@/components/feature/cart/ListingCartPhoto';
import type { MarketplaceCartLine } from '@/types';

type CheckoutLineError = { lineId: string; title: string; message: string };

function resolveImageSrc(imageUrl: string): string {
  if (!imageUrl) return '';
  return imageUrl.startsWith('http') ? imageUrl : getCdnImageUrl(imageUrl);
}

export default function CartPage() {
  const { t } = useTranslation();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const getTotal = useCartStore((s) => s.getTotal);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [checkoutErrors, setCheckoutErrors] = useState<CheckoutLineError[]>([]);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

  const itemCount = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity, 0),
    [items],
  );
  const cartTotal = getTotal();
  const { selectedGame } = useGame();

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

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <main className="container mx-auto px-4 py-10 md:py-14">
        <h1 className="mb-6 font-display text-2xl font-bold text-gray-900 md:text-3xl">{t('cart.title')}</h1>

        {itemCount === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/20 bg-primary/30 py-16 text-center shadow-[0_4px_16px_rgba(255,115,0,0.25)] ring-1 ring-white/10 backdrop-blur-2xl backdrop-saturate-150">
            <ShoppingBag className="mb-4 h-16 w-16 text-gray-400" strokeWidth={1.5} />
            <p className="mb-6 text-lg text-gray-600">{t('cart.empty')}</p>
            <Button
              asChild
              className="rounded-full border px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              style={{ backgroundColor: '#FF7300', borderColor: '#878787' }}
            >
              <Link href={getGameHomeLink()}>{t('cart.browse')}</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {items.length === 1
                  ? t('cart.itemsOne', { count: items.length })
                  : t('cart.items', { count: items.length })}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => clearCart()}
                className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                {t('cart.clear')}
              </Button>
            </div>

            {checkoutErrors.length > 0 && (
              <div className="mb-4 space-y-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {checkoutErrors.map((err) => (
                  <p key={err.lineId}>
                    <span className="font-semibold">{err.title}:</span> {err.message}
                  </p>
                ))}
              </div>
            )}

            <ul className="space-y-4">
              {items.map((item) => (
                <Card key={item.lineId} className="border-gray-200 bg-white/80">
                  <CardHeader className="flex flex-row items-center gap-4 py-4">
                    {item.source === 'marketplace' && isMarketplaceListingUuid(item.listingId) ? (
                      <ListingCartPhoto
                        listingId={item.listingId}
                        fallbackImageUrl={item.imageUrl}
                        alt={item.title}
                      />
                    ) : (
                      <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md bg-gray-100">
                        {item.imageUrl ? (
                          <Image
                            src={resolveImageSrc(item.imageUrl)}
                            alt={item.title}
                            fill
                            className="object-contain"
                            sizes="48px"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ShoppingBag className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-gray-900">{item.title}</span>
                      <span className="text-sm text-gray-600">
                        {formatEuroNoSpace(item.priceCents / 100, 'it-IT')} · {item.source === 'sync' ? 'Sync' : 'Marketplace'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 px-0"
                        onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                        aria-label="Diminuisci quantità"
                      >
                        −
                      </Button>
                      <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 px-0"
                        onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                        disabled={item.quantity >= item.maxQuantity}
                        aria-label="Aumenta quantità"
                      >
                        +
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between py-0 pb-4">
                    <span className="text-sm font-semibold text-gray-800">
                      {formatEuroNoSpace((item.priceCents / 100) * item.quantity, 'it-IT')}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(item.lineId)}
                      className="border-gray-300 text-gray-700 hover:border-red-400 hover:bg-red-50 hover:text-red-600"
                    >
                      {t('cart.remove')}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </ul>

            <div className="mt-8 flex flex-col items-end gap-3 sm:flex-row sm:justify-end">
              <p className="text-sm text-gray-600 sm:mr-auto">
                {t('cart.total')}:{' '}
                <span className="text-lg font-bold text-gray-900">
                  {formatEuroNoSpace(cartTotal, 'it-IT')}
                </span>
              </p>
              <Button
                type="button"
                disabled={checkoutSubmitting}
                onClick={() => void handleCheckout()}
                className="rounded-full border px-6 py-2.5 font-semibold text-black hover:opacity-90"
                style={{ backgroundColor: '#FF7300', borderColor: '#878787' }}
              >
                {checkoutSubmitting ? (
                  <>
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    {t('cart.checkout')}
                  </>
                ) : (
                  t('cart.checkout')
                )}
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
