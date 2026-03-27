import { ScambiLandingPage } from '@/components/feature/scambi/ScambiLandingPage';
import { Header } from '@/components/layout/Header';
import { Suspense } from 'react';

export const metadata = {
  title: 'Scambia su Ebartex | Il Marketplace di Carte Collezionabili',
  description: 'Scambia le tue carte Magic, Pokémon, One Piece e altre in totale sicurezza. Trova partner di scambio, negozia e completa transazioni protette.',
};

function ScambiPageContent() {
  return (
    <>
      <Header />
      <ScambiLandingPage />
    </>
  );
}

export default function ScambiPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#1D3160] via-[#243663] to-[#1D3160] flex items-center justify-center">
        <div className="text-white text-lg font-medium animate-pulse">
          Caricamento...
        </div>
      </div>
    }>
      <ScambiPageContent />
    </Suspense>
  );
}
