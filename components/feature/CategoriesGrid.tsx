'use client';

import Link from 'next/link';
import Image from 'next/image';
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
          {/* Griglia 3x2 con layout responsive sm:2x3, md+:3x2 */}
          <div className="relative z-10 grid w-full grid-cols-2 sm:grid-cols-3">
            {[first, second, rest[0], rest[1], rest[2], rest[3]].filter(Boolean).map((cat, index, arr) => {
              if (!cat) return null;
              const totalCols = 3;
              const isMiddleColumn = index % totalCols === 1;
              const isLastColumn = index % totalCols === 2;
              const rowCount = Math.ceil(arr.length / totalCols);
              const currentRow = Math.floor(index / totalCols);
              const isLastRow = currentRow === rowCount - 1;
              return (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.id}`}
                  className={`group relative flex items-center justify-center overflow-hidden transition-all duration-300 min-h-[100px] sm:min-h-[135px] md:min-h-[155px] ${
                    !isLastColumn ? 'border-r-2 border-white/90' : ''
                  } ${!isLastRow ? 'border-b-2 border-white' : ''}`}
                  style={{ 
                    background: CATEGORY_BACKGROUNDS[cat.id] || CATEGORY_BACKGROUNDS.singles,
                    animation: `categoryEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 120}ms both`,
                  }}
                >
                  {/* Immagine contenuta nella card (letterbox) */}
                  <Image
                    src={CATEGORY_IMAGES[cat.id] || '/emporio-collezionista/singles.png'}
                    alt={cat.label}
                    fill
                    className="object-contain p-3"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                  {/* Overlay scuro per leggibilità testo - si riduce al hover per reveal immagine */}
                  <div className="absolute inset-0 bg-black/40 transition-all duration-300 group-hover:bg-black/10 group-hover:backdrop-blur-[2px]" />
                  <CategoryTitle label={cat.label} labelLine2={cat.labelLine2} />
                </Link>
              );
            })}
          </div>
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
