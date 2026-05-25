import { Suspense } from 'react';
import { VendiLandingPage } from '@/components/feature/vendi/VendiLandingPage';
import { Header } from '@/components/layout/Header';

export const metadata = {
  title: 'Metodi di inserzione | Vendi su Ebartex',
  description: 'Scegli cosa vendere: singole, oggetti sigillati o set e edizioni. Struttura guidata come su Cardmarket.',
};

export default function VendiPage() {
  return (
    <>
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <VendiLandingPage />
    </>
  );
}
