import { Suspense } from 'react';
import { ScambiPageClient } from './scambi-page-client';
import { Header } from '@/components/layout/Header';

export const metadata = {
  title: 'Scambi | Ebartex',
  description:
    'Anteprima degli scambi di carte collezionabili — proponi, negozia e scambia in sicurezza. Presto in arrivo.',
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
