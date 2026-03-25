import { Header } from '@/components/layout/Header';
import { AsteHubPage } from '@/components/feature/aste/AsteHubPage';

export const metadata = {
  title: 'Aste | Ebartex',
  description: 'Partecipa alle aste di carte collezionabili su Ebartex',
};

export default function AstePage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <AsteHubPage />
    </main>
  );
}
