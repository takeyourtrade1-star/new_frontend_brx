'use client';

import Link from 'next/link';
import { useCartStore } from '@/lib/stores/cart-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { ShoppingBag } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function CartPage() {
  const { t } = useTranslation();
  const { items, removeItem, clearCart, getItemCount } = useCartStore();
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Header />
      <main className="container mx-auto px-4 py-10 md:py-14">
        <h1 className="mb-6 font-display text-2xl font-bold text-gray-900 md:text-3xl">{t('cart.title')}</h1>

        {getItemCount() === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50 py-16 text-center">
            <ShoppingBag className="mb-4 h-16 w-16 text-gray-400" strokeWidth={1.5} />
            <p className="mb-6 text-lg text-gray-600">{t('cart.empty')}</p>
            <Button
              asChild
              className="rounded-full border px-6 py-2.5 text-sm font-semibold text-black hover:opacity-90"
              style={{ backgroundColor: '#FF7300', borderColor: '#878787' }}
            >
              <Link href="/products">{t('cart.browse')}</Link>
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
            <ul className="space-y-4">
              {items.map((item) => (
                <Card key={item.productId} className="border-gray-200 bg-white/80">
                  <CardHeader className="flex flex-row items-center justify-between py-4">
                    <span className="font-medium text-gray-900">
                      {t('cart.product')} {item.productId}
                    </span>
                    <span className="text-sm text-gray-600">
                      {t('cart.qty')} {item.quantity}
                    </span>
                  </CardHeader>
                  <CardContent className="py-0 pb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(item.productId)}
                      className="border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-400 hover:text-red-600"
                    >
                      {t('cart.remove')}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </ul>
            <div className="mt-8 flex justify-end">
              <Button
                asChild
                className="rounded-full border px-6 py-2.5 font-semibold text-black hover:opacity-90"
                style={{ backgroundColor: '#FF7300', borderColor: '#878787' }}
              >
                <Link href="#">{t('cart.checkout')}</Link>
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
