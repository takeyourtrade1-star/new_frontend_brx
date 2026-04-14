import { Suspense } from 'react';
import { ProfiloContent } from '@/components/feature/account/ProfiloContent';
import { MascotteLoader } from '@/components/dev/MascotteLoader';

export const metadata = {
  title: 'Profilo | Account | Ebartex',
  description: 'Il tuo profilo Ebartex',
};

export default function ProfiloPage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><MascotteLoader size="sm" /></div>}>
      <div className="pointer-events-none opacity-60">
        <ProfiloContent />
      </div>
    </Suspense>
  );
}
