import { Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { ScambiNav } from '@/components/feature/scambi/ScambiNav';
import { ScambiDetailView } from '@/components/feature/scambi/ScambiDetailView';
import { MOCK_SCAMBI } from '@/components/feature/scambi/mock-scambi';

export const metadata = {
  title: 'Dettaglio scambio | Ebartex',
  description: 'Dettaglio scambio su Ebartex',
};

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return MOCK_SCAMBI.map((s) => ({ id: s.id }));
}

export default async function ScambiDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <main className="min-h-screen bg-white">
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>
      <ScambiNav />
      <ScambiDetailView scambioId={id} />
    </main>
  );
}
