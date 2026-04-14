import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { HeroCarousel } from '@/components/feature/HeroCarousel';
import { MascotteLoader } from '@/components/dev/MascotteLoader';
import { FeaturesSection } from '@/components/feature/FeaturesSection';
import { MarketplaceDashboard } from '@/components/feature/MarketplaceDashboard';
import { CategoriesGrid } from '@/components/feature/CategoriesGrid';
import { EbartexProductsSection } from '@/components/feature/EbartexProductsSection';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home | Ebartex — Marketplace Multi-Gioco',
  description:
    'Esplora il marketplace Ebartex: carte collezionabili di Magic, Pokémon e One Piece. Dashboard, categorie, prodotti in evidenza e boutique ufficiale.',
};

export default function HomePage() {
  return (
    <main
      className="min-h-screen font-sans text-white transition-colors duration-300"
      style={{
        background: 'linear-gradient(to top, #0f172a 0%, #3d65c6 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <Suspense fallback={<div className="p-8 flex justify-center"><MascotteLoader size="md" /></div>}>
        <section className="w-full transition-colors duration-300">
          <HeroCarousel />
        </section>

        <FeaturesSection />

        <MarketplaceDashboard />

        <CategoriesGrid />

        <EbartexProductsSection />
      </Suspense>
    </main>
  );
}
