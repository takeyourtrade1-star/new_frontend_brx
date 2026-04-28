import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { BrxExpressLandingPage } from '@/components/feature/brx-express/BrxExpressLandingPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BRX Express | Spedizione Carte in 24h',
  description:
    'Il servizio di logistica decentralizzata per carte collezionabili. Hub in tutta Europa, spedizione in 24 ore, zero doppie vendite. Scopri come funziona BRX Express.',
  openGraph: {
    title: 'BRX Express | Spedizione Carte in 24h',
    description:
      'Il servizio di logistica decentralizzata per carte collezionabili. Hub in tutta Europa, spedizione in 24 ore, zero doppie vendite.',
  },
};

export default function BrxExpressPage() {
  return (
    <>
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <main className="relative min-h-screen overflow-x-hidden bg-[#f6f8fb]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_6%_8%,rgba(16,185,129,0.08),transparent_32%),radial-gradient(circle_at_88%_12%,rgba(59,130,246,0.12),transparent_34%)]" />
        <div className="relative z-10">
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f6f8fb]">Caricamento...</div>}>
            <BrxExpressLandingPage />
          </Suspense>
        </div>
      </main>
    </>
  );
}
