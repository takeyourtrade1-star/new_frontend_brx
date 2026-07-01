import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { GameHeroSection } from '@/components/feature/GameHeroSection';
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
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header reserveSpace={false} />
      </Suspense>

      <section className="w-full pt-[88px] transition-colors duration-300 md:pt-[104px]">
        <GameHeroSection gameSlug={gameSlug} />
      </section>

      {/* Mobile (<640px): margine negativo ottimizzato per coprire il vuoto dell'hero senza coprire il logo. */}
      <div className="relative z-10 -mt-[36vh] sm:-mt-[60vh] md:-mt-[62vh] lg:-mt-[66vh]">
        <MarketplaceDashboard gameSlug={gameSlug} useUnifiedBackground showFeaturesBelowTopRow />

        <CategoriesGrid useUnifiedBackground />

        <EbartexProductsSection useUnifiedBackground />
      </div>
    </main>
  );
}
