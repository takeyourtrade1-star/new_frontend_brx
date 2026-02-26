'use client';

import Link from 'next/link';
import { ScrollMarquee } from './ScrollMarquee';

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
      className={`relative z-10 font-display text-center text-xl font-bold uppercase tracking-wide text-white md:text-2xl transition-all duration-200 ease-out ${className}`}
      style={{ textShadow: '0 2px 6px rgba(0,0,0,0.35)' }}
    >
      <span className="inline-block rounded-lg bg-black/35 px-4 py-2 backdrop-blur-sm transition-[text-shadow,color] duration-200 group-hover:text-[#FF7300] group-hover:[text-shadow:0_0_16px_rgba(255,115,0,0.95),0_0_32px_rgba(255,115,0,0.7),0_2px_6px_rgba(0,0,0,0.35)]">
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

const CARD_MIN_HEIGHT = 'min-h-[140px]';

export function CategoriesGrid({ categories }: { categories?: CategoryItem[] } = {}) {
  const items = categories?.length ? categories : DEFAULT_CATEGORIES;
  const [first, second, ...rest] = items;

  return (
    <section
      className="w-full py-10 md:py-14 bg-transparent text-white transition-colors duration-300"
    >
      <div className="container-content">
        <ScrollMarquee label="L'EMPORIO DEL COLLEZIONISTA" />
        <div className="relative overflow-hidden rounded-xl border-2 border-white mt-4">
          <div
            className="absolute inset-0 bg-gray-800/90"
            aria-hidden
          />
          <div
            className="relative z-10 grid w-full grid-cols-2"
            style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}
          >
            {/* Prima e seconda card unite in una sola card con divisore al centro (come Figma) */}
            {first && second && (
              <div
                className="col-span-2 flex w-full border-b border-white bg-black/25"
                style={{ minHeight: '140px' }}
              >
                <Link
                  key={first.id}
                  href={`/products?category=${first.id}`}
                  className="group relative flex flex-1 items-center justify-center transition-colors hover:bg-black/20"
                >
                  <CategoryTitle label={first.label} labelLine2={first.labelLine2} />
                </Link>
                <div
                  className="w-px shrink-0 self-stretch bg-white/70"
                  aria-hidden
                  style={{ minHeight: '100%' }}
                />
                <Link
                  key={second.id}
                  href={`/products?category=${second.id}`}
                  className="group relative flex flex-1 items-center justify-center transition-colors hover:bg-black/20"
                >
                  <CategoryTitle label={second.label} labelLine2={second.labelLine2} />
                </Link>
              </div>
            )}
            {/* Resto delle card: stessa altezza */}
            {rest.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.id}`}
                className={`group relative flex w-full items-center justify-center border border-white border-t-0 bg-black/25 transition-colors hover:bg-black/20 ${CARD_MIN_HEIGHT}`}
              >
                <CategoryTitle label={cat.label} labelLine2={cat.labelLine2} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
