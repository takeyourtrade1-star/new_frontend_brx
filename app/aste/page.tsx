import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { AsteHubPage } from '@/components/feature/aste/AsteHubPage';
import { BrxExpressPromo } from '@/components/feature/brx-express/BrxExpressPromo';

export const metadata = {
  title: 'Aste | Ebartex',
  description: 'Partecipa alle aste di carte collezionabili su Ebartex',
  alternates: { canonical: '/aste' },
};

export default function AstePage() {
  return (
    <main className="min-h-screen bg-white">
      <h1 className="sr-only">Aste di carte collezionabili su Ebartex</h1>
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <AsteHubPage />
      <BrxExpressPromo variant="auction" />
    </main>
  );
}
