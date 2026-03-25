import { StatisticheContent } from '@/components/feature/account/StatisticheContent';
import { PrestoInArrivoBanner } from '@/components/feature/account/PrestoInArrivoBanner';

export const metadata = {
  title: 'Statistiche | Ebartex',
  description: 'Sommario acquisti, vendite e referrals',
};

export default function StatistichePage() {
  return (
    <>
      <PrestoInArrivoBanner />
      <StatisticheContent />
    </>
  );
}
