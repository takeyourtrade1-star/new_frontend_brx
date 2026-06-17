import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { ScambiGuard } from '../ScambiGuard';
import { TradeProposalPage } from '@/components/feature/scambi/TradeProposalPage';

export const metadata = {
  title: 'Proponi scambio | Ebartex',
  description: 'Componi la tua proposta di scambio',
};

export default function ProponiScambioPage() {
  return (
    <main className="min-h-screen bg-[#F5F4F0]">
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <ScambiGuard>
        <TradeProposalPage />
      </ScambiGuard>
    </main>
  );
}
