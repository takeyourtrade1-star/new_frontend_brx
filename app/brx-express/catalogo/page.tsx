import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import BrxExpressCatalog from '@/components/feature/brx-express/BrxExpressCatalog';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catalogo BRX Express | Carte spedite in 24h',
  description:
    'Sfoglia il catalogo delle carte spedite e garantite da BRX Express: digitalizzate, gradate e consegnate in tutta Europa in 24 ore.',
};

export default function BrxExpressCatalogPage() {
  return (
    <>
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <BrxExpressCatalog />
    </>
  );
}
