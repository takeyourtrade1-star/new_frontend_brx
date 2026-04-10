import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { LandingWelcome } from '@/components/feature/LandingWelcome';
import { CookieBanner } from '@/components/layout/CookieBanner';

export const metadata = {
  title: 'Ebartex | Compra, Vendi e Scambia',
  description:
    'Scopri le migliori opportunità del mercato di carte collezionabili.',
};

export default function LandingPage() {
  return (
    <>
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <LandingWelcome />
      <CookieBanner />
    </>
  );
}
