import { Suspense } from 'react';
import { VendiLandingPage } from '@/components/feature/vendi/VendiLandingPage';
import { Header } from '@/components/layout/Header';

export const metadata = {
  title: 'Vendi su Ebartex | Il Marketplace di Carte Collezionabili',
  description: 'Vendi le tue carte Magic, Pokémon, One Piece e altre. Sincronizza con CardTrader, crea aste, gestisci il tuo inventario. Facile, veloce e sicuro.',
};

export default function VendiPage() {
  return (
    <>
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <VendiLandingPage />
    </>
  );
}
