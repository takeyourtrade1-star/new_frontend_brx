import { Suspense } from 'react';
import { ScambiPageClient } from './scambi-page-client';
import { BrxExpressPromo } from '@/components/feature/brx-express/BrxExpressPromo';
import { Header } from '@/components/layout/Header';

export const metadata = {
  title: 'Scambi | Ebartex',
  description: 'Scopri e partecipa agli scambi di carte collezionabili',
  alternates: { canonical: '/scambi' },
};

export default function ScambiPage() {
  return (
    <>
      <h1 className="sr-only">Scambi di carte collezionabili su Ebartex</h1>
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <ScambiPageClient />
      <BrxExpressPromo variant="trade" />
    </>
  );
}
