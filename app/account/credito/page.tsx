import { Suspense } from 'react';
import { CreditoContent } from '@/components/feature/account/CreditoContent';

export const metadata = {
  title: 'Credito | Account | Ebartex',
  description: 'Gestisci il tuo credito e i metodi di ricarica',
};

export default function CreditoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Caricamento...</div>}>
      <div className="pointer-events-none opacity-60">
        <CreditoContent />
      </div>
    </Suspense>
  );
}
