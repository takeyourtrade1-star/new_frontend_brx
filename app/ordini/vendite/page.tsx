import { Suspense } from 'react';
import { VenditeContent } from '@/components/feature/vendite/VenditeContent';

export const metadata = {
  title: 'Le mie vendite | Ordini | Ebartex',
  description: 'Gestisci le tue vendite e i pagamenti ricevuti',
};

export default function VenditePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F5F4F0]">
          <span className="sr-only">Caricamento…</span>
        </div>
      }
    >
      <VenditeContent />
    </Suspense>
  );
}
