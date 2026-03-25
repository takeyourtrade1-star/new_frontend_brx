import { Header } from '@/components/layout/Header';
import { AsteDetailView } from '@/components/feature/aste/AsteDetailView';

export const metadata = {
  title: 'Dettaglio asta | Ebartex',
  description: 'Dettaglio asta Ebartex',
};

type Props = { params: Promise<{ id: string }> };

export default async function AsteDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <AsteDetailView auctionId={id} />
    </main>
  );
}
