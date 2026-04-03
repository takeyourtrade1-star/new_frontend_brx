'use client';

import Image from 'next/image';
import { ScrollMarquee } from './ScrollMarquee';
import { ResponsiveGrid, type GridItem } from './ResponsiveGrid';
import { GridCardTitle } from './GridCardTitle';
import { getCdnImageUrl } from '@/lib/config';

/** Voce categoria Emporio – dati da backend */
export type CategoryItem = {
  id: string;
  label: string;
  labelLine2?: string;
};

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'singles', label: 'SINGLES' },
  { id: 'boosters', label: 'BOOSTERS' },
  { id: 'booster-box', label: 'BOOSTER BOX' },
  { id: 'set-lotti', label: 'SET, LOTTI,', labelLine2: 'COLLEZIONI' },
  { id: 'accessori', label: 'ACCESSORI' },
  { id: 'sigillati', label: 'PRODOTTI SIGILLATI' },
];

/** Titolo categoria con background superstondato (spezza la grafica dalle altre card) */
const CATEGORY_GLOW_COLORS: Record<string, string> = {
  singles: '255, 115, 0',
  boosters: '167, 139, 250',
  'booster-box': '56, 189, 248',
  'set-lotti': '251, 146, 60',
  accessori: '251, 191, 36',
  sigillati: '251, 113, 133',
};

const CATEGORY_IMAGES: Record<string, string> = {
  singles: '/emporio-collezionista/singles.png',
  boosters: '/emporio-collezionista/boosters.png',
  'booster-box': '/emporio-collezionista/booster-boxes.png',
  'set-lotti': '/emporio-collezionista/set-lotti-collezioni.png',
  accessori: '/emporio-collezionista/accessori.png',
  sigillati: '/emporio-collezionista/prodotti-sigillati.png',
};

const CATEGORY_BACKGROUNDS: Record<string, string> = {
  singles: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #1e293b 75%, #0f172a 100%)',
  boosters: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 25%, #5b21b6 50%, #4c1d95 75%, #2e1065 100%)',
  'booster-box': 'linear-gradient(135deg, #0c4a6e 0%, #075985 25%, #0369a1 50%, #075985 75%, #0c4a6e 100%)',
  'set-lotti': 'linear-gradient(135deg, #1c1917 0%, #292524 25%, #44403c 50%, #292524 75%, #1c1917 100%)',
  accessori: 'linear-gradient(135deg, #451a03 0%, #78350f 25%, #92400e 50%, #78350f 75%, #451a03 100%)',
  sigillati: 'linear-gradient(135deg, #881337 0%, #9f1239 25%, #be123c 50%, #9f1239 75%, #881337 100%)',
};

export function CategoriesGrid({
  categories,
  useUnifiedBackground = false,
}: {
  categories?: CategoryItem[];
  useUnifiedBackground?: boolean;
} = {}) {
  const items = categories?.length ? categories : DEFAULT_CATEGORIES;
  const heroBg = getCdnImageUrl('carousel/slide1.jpg');

  const gridItems: GridItem[] = items.map((cat, index) => ({
    id: cat.id,
    href: `/products?category=${cat.id}`,
    style: {
      background: CATEGORY_BACKGROUNDS[cat.id] || CATEGORY_BACKGROUNDS.singles,
    },
    children: (
      <>
        <Image
          src={CATEGORY_IMAGES[cat.id] || '/emporio-collezionista/singles.png'}
          alt={cat.label}
          fill
          className="object-contain p-3"
          sizes="(max-width: 640px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-black/40 transition-all duration-300 group-hover:bg-black/10 group-hover:backdrop-blur-[2px]" />
        <GridCardTitle 
          label={cat.label} 
          labelLine2={cat.labelLine2} 
          glowColor={CATEGORY_GLOW_COLORS[cat.id]}
          staggerDelay={index * 0.08}
        />
      </>
    ),
  }));

  return (
    <section className="w-full py-0 bg-transparent text-white transition-colors duration-300">
      <ScrollMarquee label="L'EMPORIO DEL COLLEZIONISTA" />
      <div>
        <div className="relative mt-0 overflow-hidden rounded-none">
          {!useUnifiedBackground && (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${heroBg})` }}
                aria-hidden
              />
              <div className="absolute inset-0 bg-black/30" aria-hidden />
            </>
          )}
          <ResponsiveGrid
            items={gridItems}
            cols={{ mobile: 2, sm: 3 }}
            itemClassName="min-h-[100px] sm:min-h-[135px] md:min-h-[155px]"
            className="relative z-10"
          />
        </div>
      </div>
    </section>
  );
}
