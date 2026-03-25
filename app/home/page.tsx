import { Header } from '@/components/layout/Header';
import { HeroCarousel } from '@/components/feature/HeroCarousel';
import { FeaturesSection } from '@/components/feature/FeaturesSection';
import { MarketplaceDashboard } from '@/components/feature/MarketplaceDashboard';
import { CategoriesGrid } from '@/components/feature/CategoriesGrid';
import { EbartexProductsSection } from '@/components/feature/EbartexProductsSection';

export default function HomePage() {
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
        <HeroCarousel />
      </section>

      <FeaturesSection />

      <MarketplaceDashboard />

      <CategoriesGrid />

      <EbartexProductsSection />
    </main>
  );
}
