import { Header } from '@/components/layout/Header';
import { AsteParticipationsPage } from '@/components/feature/aste/AsteParticipationsPage';

export const metadata = {
  title: 'Le mie partecipazioni | Ebartex',
  description: 'Aste a cui hai partecipato su Ebartex',
};

export default function AstePartecipazioniPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <AsteParticipationsPage />
    </main>
  );
}
