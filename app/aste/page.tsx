import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { AsteHubPage } from '@/components/feature/aste/AsteHubPage';

export const metadata = {
  title: 'Aste | Ebartex',
  description: 'Partecipa alle aste di carte collezionabili su Ebartex',
};

export default function AstePage() {
  return (
    <main className="min-h-screen bg-white">
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <AsteHubPage />
    </main>
  );
}
