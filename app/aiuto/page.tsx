import { Suspense } from 'react';
import { AiutoContent } from './aiuto-content';

export const metadata = {
  title: 'Aiuto e FAQ | Ebartex',
  description: 'Domande frequenti e guide su come usare Ebartex',
};

export default function AiutoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F5F4F0]">
          <span className="sr-only">Caricamento…</span>
        </div>
      }
    >
      <AiutoContent />
    </Suspense>
  );
}
