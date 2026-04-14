import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { MascotteLoader } from '@/components/dev/MascotteLoader';

const AuctionCreatePage = dynamic(
  () => import('@/components/feature/aste/create/AuctionCreatePage').then((mod) => ({ default: mod.AuctionCreatePage })),
  {
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center">
        <MascotteLoader size="md" />
      </div>
    ),
  }
);

export const metadata = {
  title: 'Nuova asta | Ebartex',
  description: 'Crea un\'asta in pochi passaggi: categoria, dettagli, prezzo, spedizione e revisione.',
};

export default function AsteNuovaPage() {
  return (
    <main className="min-h-screen bg-white">
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <ErrorBoundary>
        <AuctionCreatePage />
      </ErrorBoundary>
    </main>
  );
}
