import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LandingWelcome } from '@/components/feature/LandingWelcome';

export const metadata = {
  title: 'Ebartex | Compra e Vendi',
  description:
    'Scopri le migliori opportunità del mercato di carte collezionabili.',
};

export default function LandingPage() {
  return (
    <>
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header reserveSpace={true} />
      </Suspense>
      <LandingWelcome />
      <div className="relative z-20">
        <Footer />
      </div>
    </>
  );
}
