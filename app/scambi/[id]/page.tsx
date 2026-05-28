import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { ScambiNav } from '@/components/feature/scambi/ScambiNav';
import { ScambiDetailView } from '@/components/feature/scambi/ScambiDetailView';
import { ScambiGuard } from '../ScambiGuard';
export const metadata = {
  title: 'Dettaglio scambio | Ebartex',
  description: 'Dettaglio scambio su Ebartex',
};

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function ScambiDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <main className="min-h-screen bg-white">
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <ScambiGuard>
      <ScambiNav />
      <ScambiDetailView scambioId={id} />
      </ScambiGuard>
    </main>
  );
}
