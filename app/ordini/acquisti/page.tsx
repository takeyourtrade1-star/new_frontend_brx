import { Suspense } from 'react';
import { AcquistiContent } from '@/components/feature/acquisti/AcquistiContent';

export const metadata = {
  title: 'I miei acquisti | Ordini | Ebartex',
  description: 'Gestisci i tuoi acquisti e ordini',
};

export default function AcquistiPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F5F4F0]">
          <span className="sr-only">Caricamento…</span>
        </div>
      }
    >
      <AcquistiContent />
    </Suspense>
  );
}
