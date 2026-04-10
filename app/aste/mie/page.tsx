import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { AsteMyListingsPage } from '@/components/feature/aste/AsteMyListingsPage';

export const metadata = {
  title: 'Le mie aste | Ebartex',
  description: 'Gestisci le tue aste su Ebartex',
};

export default function AsteMiePage() {
  return (
    <main className="min-h-screen bg-white">
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <AsteMyListingsPage />
    </main>
  );
}
