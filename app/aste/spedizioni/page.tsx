import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { AsteShippingPage } from '@/components/feature/aste/AsteShippingPage';

export const metadata = {
  title: 'Spedizioni aste | Ebartex',
  description: 'Gestisci le spedizioni delle tue aste concluse',
};

export default function AsteSpedizioniPage() {
  return (
    <main className="min-h-screen bg-white">
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <Suspense fallback={<div className="container-content py-16 text-gray-500">…</div>}>
        <AsteShippingPage />
      </Suspense>
    </main>
  );
}
