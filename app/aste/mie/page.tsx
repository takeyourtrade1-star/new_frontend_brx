import { Header } from '@/components/layout/Header';
import { AsteMyListingsPage } from '@/components/feature/aste/AsteMyListingsPage';

export const metadata = {
  title: 'Le mie aste | Ebartex',
  description: 'Gestisci le tue aste su Ebartex',
};

export default function AsteMiePage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <AsteMyListingsPage />
    </main>
  );
}
