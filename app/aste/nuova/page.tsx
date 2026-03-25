import { Header } from '@/components/layout/Header';
import { AuctionCreatePage } from '@/components/feature/aste/create/AuctionCreatePage';

export const metadata = {
  title: 'Nuova asta | Ebartex',
  description: 'Crea un\'asta in pochi passaggi: categoria, dettagli, prezzo, spedizione e revisione.',
};

export default function AsteNuovaPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <AuctionCreatePage />
    </main>
  );
}
