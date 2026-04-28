import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TcgExpressLandingPage } from '@/components/feature/tcg-express/TcgExpressLandingPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TCG Express | Il Futuro del Trading Card Game',
  description:
    'L\'ecosistema phygital definitivo per il trading card game: tornei live, logistica decentralizzata e soluzioni innovative per la community.',
  openGraph: {
    title: 'TCG Express | Il Futuro del Trading Card Game',
    description:
      'L\'ecosistema phygital definitivo per il trading card game: tornei live, logistica decentralizzata e soluzioni innovative per la community.',
  },
};

export default function TcgExpressPage() {
  return (
    <>
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <main className="relative min-h-screen overflow-x-hidden bg-[#f6f8fb]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_6%_8%,rgba(16,185,129,0.08),transparent_32%),radial-gradient(circle_at_88%_12%,rgba(59,130,246,0.12),transparent_34%)]" />
        <div className="relative z-10">
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f6f8fb]">Caricamento...</div>}>
            <TcgExpressLandingPage />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
