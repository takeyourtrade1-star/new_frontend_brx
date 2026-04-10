import { Suspense } from 'react';
import { IndirizziContent } from '@/components/feature/account/IndirizziContent';

export const metadata = {
  title: 'Indirizzi | Account | Ebartex',
  description: 'Gestisci i tuoi indirizzi di spedizione e fatturazione',
};

export default function IndirizziPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Caricamento...</div>}>
      <div className="pointer-events-none opacity-60">
        <IndirizziContent />
      </div>
    </Suspense>
  );
}
