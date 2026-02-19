'use client';

import Link from 'next/link';
import { useCartStore } from '@/lib/stores/cart-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { ShoppingBag } from 'lucide-react';

export default function CartPage() {
  const { items, removeItem, clearCart, getItemCount } = useCartStore();

  return (
    <div
      className="min-h-screen font-sans text-white"
      style={{
        backgroundImage:
          'linear-gradient(rgba(61, 101, 198, 0.85), rgba(29, 49, 96, 0.85)), url("/brx_bg.png"), linear-gradient(180deg, #3D65C6 0%, #1D3160 100%)',
        backgroundRepeat: 'no-repeat, repeat, no-repeat',
        backgroundSize: 'cover, auto, cover',
        backgroundAttachment: 'fixed',
      }}
    >
      <Header />
      <main className="container mx-auto px-4 py-10 md:py-14">
        <h1 className="mb-6 font-display text-2xl font-bold md:text-3xl">
          Carrello
        </h1>

        {getItemCount() === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/20 bg-white/10 py-16 text-center">
            <ShoppingBag className="mb-4 h-16 w-16 text-white/60" strokeWidth={1.5} />
            <p className="mb-6 text-lg text-white/90">Il tuo carrello è vuoto.</p>
            <Button
              asChild
              className="rounded-full border px-6 py-2.5 text-sm font-semibold text-black hover:opacity-90"
              style={{ backgroundColor: '#FF7300', borderColor: '#878787' }}
            >
              <Link href="/products">Sfoglia i prodotti</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-white/80">
                {items.length} {items.length === 1 ? 'articolo' : 'articoli'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => clearCart()}
                className="border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                Svuota carrello
              </Button>
            </div>
            <ul className="space-y-4">
              {items.map((item) => (
                <Card key={item.productId} className="border-white/20 bg-white/10">
                  <CardHeader className="flex flex-row items-center justify-between py-4">
                    <span className="font-medium text-white">
                      Prodotto {item.productId}
                    </span>
                    <span className="text-sm text-white/80">
                      Q.tà: {item.quantity}
                    </span>
                  </CardHeader>
                  <CardContent className="py-0 pb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(item.productId)}
                      className="border-white/30 text-white hover:bg-red-500/20 hover:border-red-400 hover:text-white"
                    >
                      Rimuovi
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </ul>
            <div className="mt-8 flex justify-end">
              <Button
                asChild
                className="rounded-full px-6 py-2.5 font-semibold text-black"
                style={{ backgroundColor: '#FF7300' }}
              >
                <Link href="#">Procedi al checkout</Link>
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
