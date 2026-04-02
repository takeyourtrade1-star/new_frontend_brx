'use client';

import Link from 'next/link';
import Image from 'next/image';
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

const PRODUCT_BACKGROUNDS: Record<string, string> = {
  dadi: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #4338ca 50%, #312e81 75%, #1e1b4b 100%)',
  buste: 'linear-gradient(135deg, #064e3b 0%, #065f46 25%, #059669 50%, #065f46 75%, #064e3b 100%)',
  tappetini: 'linear-gradient(135deg, #7c2d12 0%, #9a3412 25%, #c2410c 50%, #9a3412 75%, #7c2d12 100%)',
  memorabilia: 'linear-gradient(135deg, #581c87 0%, #7c3aed 25%, #8b5cf6 50%, #7c3aed 75%, #581c87 100%)',
  albums: 'linear-gradient(135deg, #0c4a6e 0%, #075985 25%, #0369a1 50%, #075985 75%, #0c4a6e 100%)',
  'game-kits': 'linear-gradient(135deg, #3f3f46 0%, #52525b 25%, #71717a 50%, #52525b 75%, #3f3f46 100%)',
};

const DEFAULT_PRODUCTS: BoutiqueProductItem[] = [
  { id: 'dadi', label: 'DADI', href: '/products?category=dadi', imageUrl: '/ebartex-boutique/dadi-boutique.webp' },
  { id: 'buste', label: 'BUSTE', href: '/products?category=buste', imageUrl: '/ebartex-boutique/buste-boutique.webp' },
  { id: 'tappetini', label: 'TAPPETINI', href: '/products?category=tappetini', imageUrl: '/ebartex-boutique/tappetini-boutique.webp' },
  { id: 'memorabilia', label: 'MEMORABILIA', href: '/products?category=memorabilia', imageUrl: '/ebartex-boutique/memorabilia-boutique.webp' },
  { id: 'albums', label: 'ALBUMS', href: '/products?category=albums', imageUrl: '/ebartex-boutique/albums-boutique.webp' },
  { id: 'game-kits', label: 'GAME KITS', href: '/products?category=game-kits', imageUrl: '/ebartex-boutique/gamekits-boutique.webp' },
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

export function EbartexProductsSection({
  products,
  useUnifiedBackground = false,
}: {
  products?: BoutiqueProductItem[];
  useUnifiedBackground?: boolean;
} = {}) {
  const items = products?.length ? products : DEFAULT_PRODUCTS;
  const [first, second, ...rest] = items;
  const bgImage = getCdnImageUrl('acquisti-frames/Frame%20336.jpg');

  return (
    <section className="w-full pb-10 pt-0 md:pb-14 bg-transparent text-white">
      {/* Barra full width senza margini laterali */}
      <ScrollMarquee label="EBARTEX BOUTIQUE" />
      
      <div className="relative mt-0 overflow-hidden rounded-none">
        {!useUnifiedBackground && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${bgImage})` }}
              aria-hidden
            />
            <div className="absolute inset-0 bg-black/40" aria-hidden />
          </>
        )}
        
        {/* Griglia 1x6 con stile CategoriesGrid */}
        <div className="relative z-10 grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {[first, second, rest[0], rest[1], rest[2], rest[3]].filter(Boolean).map((item, index, arr) => {
            if (!item) return null;
            const totalCols = 6;
            const isLastColumn = index === arr.length - 1;
            const rowCount = Math.ceil(arr.length / totalCols);
            const currentRow = Math.floor(index / totalCols);
            const isLastRow = currentRow === rowCount - 1;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`group relative flex min-h-[100px] sm:min-h-[135px] lg:min-h-[155px] items-center justify-center overflow-hidden transition-all duration-300 ${
                  !isLastColumn ? 'border-r-2 border-white/90' : ''
                } ${!isLastRow ? 'border-b-2 border-white' : ''}`}
                style={{ 
                  animation: `categoryEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 120}ms both`,
                }}
              >
                {/* Immagine full-bleed come sfondo */}
                {item.imageUrl && (
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${item.imageUrl})` }}
                    aria-hidden
                  />
                )}
                {/* Overlay scuro per leggibilità testo - si riduce al hover per reveal immagine */}
                <div className="absolute inset-0 bg-black/40 transition-all duration-300 group-hover:bg-black/10 group-hover:backdrop-blur-[2px]" aria-hidden />
                
                {/* Titolo */}
                <ProductTitle label={item.label} labelLine2={item.labelLine2} />
              </Link>
            );
          })}
        </div>
      </div>
      <style jsx>{`
        @keyframes categoryEnter {
          0% {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          60% {
            opacity: 0.8;
            transform: translateY(-5px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </section>
  );
}
