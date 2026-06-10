import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import BrxExpressLanding from '@/components/feature/brx-express/BrxExpressLanding';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BRX Express | Spedizione Carte in 24h',
  description: 'Scopri la rivoluzione delle spedizioni di carte collezionabili con BRX Express. Spedisci le tue carte all\'hub una sola volta, le vendiamo e le consegniamo in tutta Europa in 24 ore.',
};

export default function BrxExpressPage() {
  return (
    <>
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <BrxExpressLanding />
    </>
  );
}
