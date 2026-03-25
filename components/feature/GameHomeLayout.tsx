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
    <main
      className="min-h-screen font-sans text-white transition-colors duration-300"
      style={{
        background: 'linear-gradient(to top, #0f172a 0%, #3d65c6 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      <Header />

      <section className="w-full transition-colors duration-300">
        <GameHeroSection gameSlug={gameSlug} />
      </section>

      <FeaturesSection />

      <MarketplaceDashboard />

      <CategoriesGrid />

      <EbartexProductsSection />
    </main>
  );
}
