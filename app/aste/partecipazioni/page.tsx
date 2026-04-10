import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { AsteParticipationsPage } from '@/components/feature/aste/AsteParticipationsPage';

export const metadata = {
  title: 'Le mie partecipazioni | Ebartex',
  description: 'Aste a cui hai partecipato su Ebartex',
};

export default function AstePartecipazioniPage() {
  return (
    <main className="min-h-screen bg-white">
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <AsteParticipationsPage />
    </main>
  );
}
