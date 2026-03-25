import { TransazioniContent } from '@/components/feature/account/TransazioniContent';
import { PrestoInArrivoBanner } from '@/components/feature/account/PrestoInArrivoBanner';

export const metadata = {
  title: 'Transazioni | Ebartex',
  description: 'Visualizza e filtra le tue transazioni',
};

export default function TransazioniPage() {
  return (
    <>
      <PrestoInArrivoBanner />
      <TransazioniContent />
    </>
  );
}
