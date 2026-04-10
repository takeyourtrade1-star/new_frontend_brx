'use client';

import { getCdnImageUrl } from '@/lib/config';
import { ResponsiveGrid, type GridItem } from './ResponsiveGrid';
import { ScrollMarquee } from './ScrollMarquee';
import { GridCardTitle } from './GridCardTitle';

/** Voce Ebartex Boutique – dati da backend */
export type BoutiqueProductItem = {
  id: string;
  label: string;
  labelLine2?: string;
  href: string;
  imageUrl?: string | null;
};

const DEFAULT_PRODUCTS: BoutiqueProductItem[] = [
  { id: 'dadi', label: 'DADI', href: '/products?category=dadi', imageUrl: '/ebartex-boutique/dadi-boutique.webp' },
  { id: 'buste', label: 'BUSTE', href: '/products?category=buste', imageUrl: '/ebartex-boutique/buste-boutique.webp' },
  { id: 'tappetini', label: 'TAPPETINI', href: '/products?category=tappetini', imageUrl: '/ebartex-boutique/tappetini-boutique.webp' },
  { id: 'memorabilia', label: 'MEMORABILIA', href: '/products?category=memorabilia', imageUrl: '/ebartex-boutique/memorabilia-boutique.webp' },
  { id: 'albums', label: 'ALBUMS', href: '/products?category=albums', imageUrl: '/ebartex-boutique/albums-boutique.webp' },
  { id: 'game-kits', label: 'GAME KITS', href: '/products?category=game-kits', imageUrl: '/ebartex-boutique/gamekits-boutique.webp' },
];

const BOUTIQUE_GLOW_COLORS: Record<string, string> = {
  dadi: '251, 191, 36',
  buste: '167, 139, 250',
  tappetini: '56, 189, 248',
  memorabilia: '251, 146, 60',
  albums: '251, 113, 133',
  'game-kits': '255, 115, 0',
};

export function EbartexProductsSection({
  products,
  useUnifiedBackground = false,
}: {
  products?: BoutiqueProductItem[];
  useUnifiedBackground?: boolean;
} = {}) {
  const items = products?.length ? products : DEFAULT_PRODUCTS;
  const bgImage = getCdnImageUrl('acquisti-frames/Frame%20336.jpg');

  // Transform products to GridItem format
  const gridItems: GridItem[] = items.map((item, index) => ({
    id: item.id,
    href: item.href,
    style: item.imageUrl
      ? { backgroundImage: `url(${item.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : undefined,
    children: (
      <>
        {/* Overlay scuro per leggibilità testo - si riduce al hover per reveal immagine */}
        <div
          className="absolute inset-0 bg-black/40 transition-all duration-300 group-hover:bg-black/10 group-hover:backdrop-blur-[2px]"
          aria-hidden
        />
        <GridCardTitle 
          label={item.label} 
          labelLine2={item.labelLine2}
          glowColor={BOUTIQUE_GLOW_COLORS[item.id]}
          staggerDelay={index * 0.08}
        />
      </>
    ),
  }));

  return (
    <section className="w-full pb-10 pt-0 md:pb-14 bg-transparent text-white">
      {/* Barra full width senza margini laterali */}
      <ScrollMarquee label="EBARTEX BOUTIQUE" direction="right" />

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

        <ResponsiveGrid
          items={gridItems}
          cols={{ mobile: 2, sm: 3, lg: 6 }}
          itemClassName="min-h-[100px] sm:min-h-[135px] lg:min-h-[155px]"
          className="relative z-10"
        />
      </div>
    </section>
  );
}
