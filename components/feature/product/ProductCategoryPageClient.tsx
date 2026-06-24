'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { MissingPage } from '@/components/shared/MissingPage';
import { ProductCategoryView } from './SinglesView';
import { useGame } from '@/lib/contexts/GameContext';
import { PRODUCT_CATEGORIES } from '@/lib/product-categories';
import type { ProductCategorySlug } from '@/lib/product-categories';

interface ProductCategoryPageClientProps {
  categorySlug: string;
}

export function ProductCategoryPageClient({ categorySlug }: ProductCategoryPageClientProps) {
  const { selectedGame } = useGame();
  const config = PRODUCT_CATEGORIES.find((c) => c.slug === categorySlug);

  if (!config) {
    return (
      <main className="min-h-screen bg-[#F0F0F0]">
        <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
          <Header />
        </Suspense>
        <div className="container-content">
          <MissingPage
            className="min-h-0 py-12"
            title="Categoria non trovata"
            description="La categoria che stai cercando non esiste o non è più disponibile."
            actions={
              <Link
                href="/products/singles"
                className="inline-flex items-center gap-2 rounded-full bg-[#FF8800] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#e67a00]"
              >
                Vai a Singles
              </Link>
            }
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F0F0F0]">
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <ProductCategoryView
        game={selectedGame}
        title={config.title}
        subtitle={config.subtitle}
        categorySlug={config.slug as ProductCategorySlug}
        categoryLabel={config.categoryLabel}
        categoryId={config.categoryId}
        showCardDetails={categorySlug === 'singles'}
      />
    </main>
  );
}
