'use client';

import Link from 'next/link';
import { ScrollMarquee } from './ScrollMarquee';
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
function CategoryTitle({
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
      className={`relative z-10 text-center font-sans text-3xl font-bold uppercase leading-none tracking-[0.04em] text-white transition-all duration-200 ease-out md:text-5xl ${className}`}
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

const CARD_MIN_HEIGHT = 'min-h-[200px] md:min-h-[230px]';

export function CategoriesGrid({ categories }: { categories?: CategoryItem[] } = {}) {
  const items = categories?.length ? categories : DEFAULT_CATEGORIES;
  const [first, second, ...rest] = items;
  const heroBg = getCdnImageUrl('carousel/slide1.jpg');

  return (
    <section
      className="w-full py-0 bg-transparent text-white transition-colors duration-300"
    >
      {/* Barra full width senza margini laterali */}
      <ScrollMarquee label="L'EMPORIO DEL COLLEZIONISTA" />
      <div>
        <div className="relative mt-0 overflow-hidden rounded-none">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroBg})` }}
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-black/30"
            aria-hidden
          />
          {/* Griglia 2x3 per linee divisorie perfette */}
          <div className="relative z-10 grid w-full grid-cols-2">
            {[first, second, rest[0], rest[1], rest[2], rest[3]].filter(Boolean).map((cat, index) => {
              if (!cat) return null;
              const isLeftColumn = index % 2 === 0;
              const isLastRow = index >= 4;
              return (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.id}`}
                  className={`group relative flex items-center justify-center transition-colors hover:bg-black/10 min-h-[200px] md:min-h-[230px] ${
                    isLeftColumn ? 'border-r border-white/70' : ''
                  } ${!isLastRow ? 'border-b border-white/80' : ''}`}
                >
                  <CategoryTitle label={cat.label} labelLine2={cat.labelLine2} />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
