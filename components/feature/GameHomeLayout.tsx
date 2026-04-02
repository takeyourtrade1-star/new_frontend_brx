'use client';

import { Header } from '@/components/layout/Header';
import { GameHeroSection } from '@/components/feature/GameHeroSection';
import { FeaturesSection } from '@/components/feature/FeaturesSection';
import { MarketplaceDashboard } from '@/components/feature/MarketplaceDashboard';
import { CategoriesGrid } from '@/components/feature/CategoriesGrid';
import { EbartexProductsSection } from '@/components/feature/EbartexProductsSection';
import type { GameSlug } from '@/lib/contexts/GameContext';

interface GameHomeLayoutProps {
  gameSlug: GameSlug;
}

/** Layout condiviso per le 3 home dedicate (Magic, Pokémon, One Piece): stessa struttura, hero con logo del gioco. */
export function GameHomeLayout({ gameSlug }: GameHomeLayoutProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-100 font-sans text-white transition-colors duration-300">
      <Header />

      <section className="w-full transition-colors duration-300">
        <GameHeroSection gameSlug={gameSlug} />
      </section>

      <div className="relative z-10 -mt-[62vh]">
        <FeaturesSection useUnifiedBackground />

        <MarketplaceDashboard gameSlug={gameSlug} useUnifiedBackground />

        <CategoriesGrid useUnifiedBackground />

        <EbartexProductsSection useUnifiedBackground />
      </div>
    </main>
  );
}
