import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { AsteDetailView } from '@/components/feature/aste/AsteDetailView';

export const metadata = {
  title: 'Dettaglio asta | Ebartex',
  description: 'Dettaglio asta Ebartex',
};

type Props = { params: Promise<{ id: string }> };

export default async function AsteDetailPage({ params }: Props) {
  const { id } = await params;

  // Reject non-numeric IDs early to avoid a silent RSC crash
  if (!id || Number.isNaN(Number(id)) || Number(id) <= 0) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white">
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <AsteDetailView auctionId={id} />
    </main>
  );
}
