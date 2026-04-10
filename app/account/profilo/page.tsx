import { Suspense } from 'react';
import { ProfiloContent } from '@/components/feature/account/ProfiloContent';

export const metadata = {
  title: 'Profilo | Account | Ebartex',
  description: 'Il tuo profilo Ebartex',
};

export default function ProfiloPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Caricamento...</div>}>
      <div className="pointer-events-none opacity-60">
        <ProfiloContent />
      </div>
    </Suspense>
  );
}
