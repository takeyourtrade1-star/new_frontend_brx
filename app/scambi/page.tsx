import { Suspense } from 'react';
import { ScambiPageClient } from './scambi-page-client';
import { Header } from '@/components/layout/Header';

export const metadata = {
  title: 'Scambi | Ebartex',
  description: 'Scopri e partecipa agli scambi di carte collezionabili',
};

export default function ScambiPage() {
  return (
    <>
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <ScambiPageClient />
    </>
  );
}
