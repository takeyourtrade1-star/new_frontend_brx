import { Header } from '@/components/layout/Header';
import { HeroCarousel } from '@/components/feature/HeroCarousel';
import { FeaturesSection } from '@/components/feature/FeaturesSection';
import { MarketplaceDashboard } from '@/components/feature/MarketplaceDashboard';
import { CategoriesGrid } from '@/components/feature/CategoriesGrid';
import { EbartexProductsSection } from '@/components/feature/EbartexProductsSection';
import { Footer } from '@/components/layout/Footer';

export default function HomePage() {
  return (
    <main
      className="min-h-screen font-sans text-white transition-colors duration-300"
      style={{
        backgroundImage:
          'linear-gradient(rgba(61, 101, 198, 0.85), rgba(29, 49, 96, 0.85)), url("/brx_bg.png"), linear-gradient(180deg, #3D65C6 0%, #1D3160 100%)',
        backgroundRepeat: 'no-repeat, repeat, no-repeat',
        backgroundSize: 'cover, auto, cover',
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

      <Footer />
    </main>
  );
}
