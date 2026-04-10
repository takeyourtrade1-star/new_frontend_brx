import { Suspense } from 'react';
import { StatisticheContent } from '@/components/feature/account/StatisticheContent';

export const metadata = {
  title: 'Statistiche | Ebartex',
  description: 'Sommario acquisti, vendite e referrals',
};

export default function StatistichePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Caricamento...</div>}>
      <div className="pointer-events-none opacity-60">
        <StatisticheContent />
      </div>
    </Suspense>
  );
}
