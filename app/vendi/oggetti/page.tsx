import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { SellObjectsContent } from '@/components/feature/vendi/SellObjectsContent';

export const metadata = {
  title: 'Vendi oggetti — scegli categoria | Ebartex',
  description: 'Scegli boosters, booster box, set e lotti, prodotti sigillati o accessori per metterli in vendita.',
};

export default function VendiOggettiPage() {
  return (
    <>
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <SellObjectsContent />
    </>
  );
}
