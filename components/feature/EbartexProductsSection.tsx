'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getCdnImageUrl } from '@/lib/config';
import { ScrollMarquee } from './ScrollMarquee';

/** Voce Ebartex Boutique – dati da backend */
export type BoutiqueProductItem = {
  id: string;
  label: string;
  labelLine2?: string;
  href: string;
  imageUrl?: string | null;
};

const DEFAULT_PRODUCTS: BoutiqueProductItem[] = [
  { id: 'dadi', label: 'DADI', href: '/products?category=dadi', imageUrl: '/ebartex-boutique/dadi-boutique.png' },
  { id: 'buste', label: 'BUSTE', href: '/products?category=buste', imageUrl: '/ebartex-boutique/buste-boutique.png' },
  { id: 'tappetini', label: 'TAPPETINI', href: '/products?category=tappetini', imageUrl: '/ebartex-boutique/tappetini-boutique.png' },
  { id: 'memorabilia', label: 'MEMORABILIA', href: '/products?category=memorabilia', imageUrl: '/ebartex-boutique/memorabilia-boutique.png' },
  { id: 'albums', label: 'ALBUMS', href: '/products?category=albums', imageUrl: '/ebartex-boutique/albums-boutique.png' },
  { id: 'game-kits', label: 'GAME KITS', href: '/products?category=game-kits', imageUrl: '/ebartex-boutique/gamekits-boutique.png' },
];

/** Titolo prodotto boutique con stile CategoriesGrid */
function ProductTitle({
  label,
  labelLine2,
  className = '',
}: {
  label: string;
  labelLine2?: string;
  className?: string;
}) {
  return (
    <span
      className={`relative z-10 text-center font-display text-lg font-bold uppercase leading-none tracking-[0.04em] text-white transition-all duration-200 ease-out md:text-2xl ${className}`}
      style={{ textShadow: '0 2px 12px rgba(0,0,0,0.45)' }}
    >
      <span className="inline-block px-4 py-2 transition-colors duration-200 group-hover:text-[#FF7300]">
        {labelLine2 ? (
          <>
            <span className="block">{label}</span>
            <span className="block">{labelLine2}</span>
          </>
        ) : (
          label
        )}
      </span>
    </span>
  );
}

export function EbartexProductsSection({ products }: { products?: BoutiqueProductItem[] } = {}) {
  const items = products?.length ? products : DEFAULT_PRODUCTS;
  const [first, second, ...rest] = items;
  const bgImage = getCdnImageUrl('acquisti-frames/Frame%20336.jpg');

  return (
    <section className="w-full pb-10 pt-0 md:pb-14 bg-transparent text-white">
      {/* Barra full width senza margini laterali */}
      <ScrollMarquee label="EBARTEX BOUTIQUE" />
      
      <div className="relative mt-0 overflow-hidden rounded-none">
        {/* Sfondo immagine */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bgImage})` }}
          aria-hidden
        />
        {/* Overlay scuro */}
        <div
          className="absolute inset-0 bg-black/40"
          aria-hidden
        />
        
        {/* Griglia 1x6 con stile CategoriesGrid */}
        <div className="relative z-10 grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {[first, second, rest[0], rest[1], rest[2], rest[3]].filter(Boolean).map((item, index, arr) => {
            if (!item) return null;
            const totalCols = 6;
            const isLastColumn = index === arr.length - 1;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`group relative flex min-h-[100px] sm:min-h-[135px] lg:min-h-[155px] items-center justify-center overflow-hidden transition-colors hover:bg-black/10 animate-in fade-in slide-in-from-bottom-4 duration-500 ${
                  !isLastColumn ? 'border-r border-white/70' : ''
                }`}
                style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'both' }}
              >
                {/* Immagine di sfondo della cella */}
                {item.imageUrl && (
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url(${item.imageUrl})` }}
                    aria-hidden
                  />
                )}
                {/* Overlay scuro per leggibilità testo */}
                <div className="absolute inset-0 bg-black/30 transition-colors duration-200 group-hover:bg-black/20" aria-hidden />
                
                {/* Titolo */}
                <ProductTitle label={item.label} labelLine2={item.labelLine2} />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
