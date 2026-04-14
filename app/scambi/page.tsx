import dynamic from 'next/dynamic';
import { Header } from '@/components/layout/Header';
import { Suspense } from 'react';
import { MascotteLoader } from '@/components/dev/MascotteLoader';

const ScambiLandingPage = dynamic(
  () => import('@/components/feature/scambi/ScambiLandingPage').then((mod) => ({ default: mod.ScambiLandingPage })),
  {
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center bg-gradient-to-br from-[#1D3160] via-[#243663] to-[#1D3160]">
        <MascotteLoader size="md" />
      </div>
    ),
  }
);

function ScambiPageContent() {
  return (
    <>
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <ScambiLandingPage />
    </>
  );
}

export const metadata = {
  title: 'Scambia su Ebartex | Il Marketplace di Carte Collezionabili',
  description: 'Scambia le tue carte Magic, Pokémon, One Piece e altre in totale sicurezza. Trova partner di scambio, negozia e completa transazioni protette.',
};

export default function ScambiPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#1D3160] via-[#243663] to-[#1D3160] flex items-center justify-center">
        <MascotteLoader size="md" />
      </div>
    }>
      <ScambiPageContent />
    </Suspense>
  );
}
