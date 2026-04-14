import { Suspense } from 'react';
import { IndirizziContent } from '@/components/feature/account/IndirizziContent';
import { MascotteLoader } from '@/components/dev/MascotteLoader';

export const metadata = {
  title: 'Indirizzi | Account | Ebartex',
  description: 'Gestisci i tuoi indirizzi di spedizione e fatturazione',
};

export default function IndirizziPage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><MascotteLoader size="sm" /></div>}>
      <div className="pointer-events-none opacity-60">
        <IndirizziContent />
      </div>
    </Suspense>
  );
}
