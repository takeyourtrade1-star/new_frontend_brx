import { Suspense } from 'react';
import { StatisticheContent } from '@/components/feature/account/StatisticheContent';
import { PrestoInArrivoBanner } from '@/components/feature/account/PrestoInArrivoBanner';

export const metadata = {
  title: 'Statistiche | Ebartex',
  description: 'Sommario acquisti, vendite e referrals',
};

export default function StatistichePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Caricamento...</div>}>
      <PrestoInArrivoBanner />
      <div className="pointer-events-none opacity-60">
        <StatisticheContent />
      </div>
    </Suspense>
  );
}
