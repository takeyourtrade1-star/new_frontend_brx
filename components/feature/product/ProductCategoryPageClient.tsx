'use client';

import { Header } from '@/components/layout/Header';
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
        <Header />
        <div className="container-content py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Categoria non trovata</h1>
          <p className="mt-2 text-gray-600">
            <a href="/products/singles" className="text-[#FF8800] hover:underline">
              Vai a Singles
            </a>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F0F0F0]">
      <Header />
      <ProductCategoryView
        game={selectedGame}
        title={config.title}
        categorySlug={config.slug as ProductCategorySlug}
        categoryLabel={config.categoryLabel}
        categoryId={config.categoryId}
        showCardDetails={categorySlug === 'singles'}
      />
    </main>
  );
}
