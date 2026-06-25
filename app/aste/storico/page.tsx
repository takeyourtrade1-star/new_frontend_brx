import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { AsteHistoryPage } from '@/components/feature/aste/AsteHistoryPage';

export const metadata = {
  title: 'Storico | Ebartex',
  description: 'Storico delle tue aste su Ebartex',
};

export default function AsteStoricoPage() {
  return (
    <main className="min-h-screen bg-white">
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <AsteHistoryPage />
    </main>
  );
}
