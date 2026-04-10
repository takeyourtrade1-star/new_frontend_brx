import { Suspense } from 'react';
import { TransazioniContent } from '@/components/feature/account/TransazioniContent';
import { PrestoInArrivoBanner } from '@/components/feature/account/PrestoInArrivoBanner';

export const metadata = {
  title: 'Transazioni | Ebartex',
  description: 'Visualizza e filtra le tue transazioni',
};

export default function TransazioniPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Caricamento...</div>}>
      <PrestoInArrivoBanner />
      <div className="pointer-events-none opacity-60">
        <TransazioniContent />
      </div>
    </Suspense>
  );
}
