import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { ScambiNav } from '@/components/feature/scambi/ScambiNav';
import { ScambiContent } from '@/components/feature/scambi/ScambiContent';
import { ScambiGuard } from '../ScambiGuard';

export const metadata = {
  title: 'Scambi in corso | Ebartex',
};

export default function MieiScambiPage() {
  return (
    <>
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <ScambiGuard>
        <ScambiNav />
        <ScambiContent />
      </ScambiGuard>
    </>
  );
}
