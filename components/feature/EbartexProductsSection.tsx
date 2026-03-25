'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getCdnImageUrl } from '@/lib/config';
import { ScrollMarquee } from './ScrollMarquee';

/** Voce Ebartex Boutique – dati da backend */
export type BoutiqueProductItem = {
  id: string;
  label: string;
  href: string;
  imageUrl?: string | null;
};

/** Placeholder con immagini da public/images (card-3, acquisti-frames) */
const DEFAULT_PRODUCTS: BoutiqueProductItem[] = [
  { id: 'dadi', label: 'DADI', href: '/products?category=dadi', imageUrl: getCdnImageUrl('card-3/4978fe1369c0fbf68d42ac63d0582ffc6cf67d60.png') },
  { id: 'buste', label: 'BUSTE', href: '/products?category=buste', imageUrl: getCdnImageUrl('card-3/8b5d86761fe7404aee02bee1471c3e0fc815d3bb.png') },
  { id: 'tappetini', label: 'TAPPETINI', href: '/products?category=tappetini', imageUrl: getCdnImageUrl('card-3/a8020835a8ffd96555a4b53cd6ef0d04866ca8b1.png') },
  { id: 'memorabilia', label: 'MEMORABILIA', href: '/products?category=memorabilia', imageUrl: getCdnImageUrl('acquisti-frames/Frame%20334.jpg') },
  { id: 'albums', label: 'ALBUMS', href: '/products?category=albums', imageUrl: getCdnImageUrl('acquisti-frames/Frame%20335.jpg') },
  { id: 'game-kits', label: 'GAME KITS', href: '/products?category=game-kits', imageUrl: getCdnImageUrl('acquisti-frames/Frame%20336.jpg') },
];

export function EbartexProductsSection({ products }: { products?: BoutiqueProductItem[] } = {}) {
  const items = products?.length ? products : DEFAULT_PRODUCTS;

  return (
    <section className="w-full pb-10 pt-0 md:pb-14 bg-transparent text-white">
      {/* Barra full width senza margini laterali */}
      <ScrollMarquee label="EBARTEX BOUTIQUE" />
      <div className="container-content">
        <div className="mt-4 flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="grid min-w-0 flex-1 grid-cols-2 grid-rows-auto items-stretch gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="group relative flex min-h-[160px] w-full flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/5 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:border-[#ff7300]/50 hover:shadow-xl hover:shadow-[#ff7300]/10"
              >
                <div className="relative min-h-[120px] flex-1">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-700/90 to-gray-800/80" aria-hidden />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                </div>
                <div className="absolute inset-x-0 bottom-0 flex justify-center pb-3 pt-8">
                  <span
                    className="inline-flex min-h-[38px] min-w-[100px] items-center justify-center rounded-xl px-4 py-2 text-center text-sm font-bold uppercase tracking-wide text-white shadow-lg backdrop-blur-md"
                    style={{
                      backgroundColor: 'rgba(15, 25, 45, 0.8)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <Link
            href="/products"
            className="flex shrink-0 items-center justify-center gap-1.5 self-center rounded-full border-2 border-[#ff7300] bg-[#ff7300]/10 px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#ff7300] transition-colors hover:bg-[#ff7300] hover:text-white"
            aria-label="Vedi tutto i prodotti"
          >
            <span>Vedi tutto</span>
            <ChevronRight className="h-5 w-5 shrink-0" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
