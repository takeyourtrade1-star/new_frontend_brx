import { Suspense } from 'react';
import { StatisticheContent } from '@/components/feature/account/StatisticheContent';
import { MascotteLoader } from '@/components/dev/MascotteLoader';

export const metadata = {
  title: 'Statistiche | Ebartex',
  description: 'Sommario acquisti, vendite e referrals',
};

export default function StatistichePage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><MascotteLoader size="sm" /></div>}>
      <div className="pointer-events-none opacity-60">
        <StatisticheContent />
      </div>
    </Suspense>
  );
}
