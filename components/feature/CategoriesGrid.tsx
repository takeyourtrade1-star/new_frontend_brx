'use client';

import Link from 'next/link';
import { getCdnImageUrl } from '@/lib/config';

const CATEGORIES = [
  { id: 'singles', label: 'SINGLES' },
  { id: 'boosters', label: 'BOOSTERS' },
  { id: 'booster-box', label: 'BOOSTER BOX' },
  { id: 'set-lotti', label: 'SET, LOTTI,', labelLine2: 'COLLEZIONI' },
  { id: 'accessori', label: 'ACCESSORI' },
  { id: 'sigillati', label: 'PRODOTTI SIGILLATI' },
] as const;

export function CategoriesGrid() {
  return (
    <section
      className="w-full py-10 md:py-14 bg-transparent text-white transition-colors duration-300"
    >
      <div className="mx-auto max-w-7xl px-2 sm:px-3">
        <div className="flex w-full justify-center pb-4 -mt-2 pt-0">
          <span
            className="text-center text-2xl font-bold uppercase tracking-wide md:text-3xl"
            style={{
              background: 'linear-gradient(135deg, #FAE27A 0%, #DA6B32 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              borderBottom: '3px solid #DA6B32',
              paddingBottom: 4,
            }}
          >
            I PRODOTTI MIGLIORI
          </span>
        </div>
        <div className="relative overflow-hidden rounded-xl border-2 border-white">
          <div
            className="absolute inset-0 scale-105 bg-cover bg-center"
            style={{
              backgroundImage: `url(${getCdnImageUrl('category-cards-bg.jpg')})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(3px)',
              transform: 'scale(1.05)',
            }}
            aria-hidden
          />
          <div
            className="relative z-10 grid"
            style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}
          >
          {CATEGORIES.map((cat, i) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.id}`}
              className="group relative flex aspect-[2/1] items-center justify-center border border-white bg-black/25 transition-transform hover:bg-black/20 hover:scale-[1.01]"
            >
              <span
                className="relative z-10 font-display text-center text-xl font-bold uppercase tracking-wide text-white md:text-2xl"
                style={{
                  textShadow: '0 2px 6px rgba(0,0,0,0.35)',
                }}
              >
                {'labelLine2' in cat && cat.labelLine2 ? (
                  <>
                    <span className="block">{cat.label}</span>
                    <span className="block">{cat.labelLine2}</span>
                  </>
                ) : (
                  cat.label
                )}
              </span>
            </Link>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}
