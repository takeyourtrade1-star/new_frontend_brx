import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { ScambiPageClient } from './scambi-page-client';

export const metadata = {
  title: 'Scambi | Ebartex',
  description: 'Scambia carte collezionabili in totale sicurezza su Ebartex',
};

export default function ScambiPage() {
  return (
    <main className="min-h-screen bg-white">
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <ScambiPageClient />
    </main>
  );
}
