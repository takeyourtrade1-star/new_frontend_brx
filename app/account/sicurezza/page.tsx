import { Suspense } from 'react';
import dynamicImport from 'next/dynamic';
import { MascotteLoader } from '@/components/dev/MascotteLoader';

export const dynamic = 'force-dynamic';

const SicurezzaContent = dynamicImport(
  () => import('@/components/feature/account/SicurezzaContent').then((mod) => ({ default: mod.SicurezzaContent })),
  {
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center">
        <MascotteLoader size="sm" />
      </div>
    ),
  }
);

export const metadata = {
  title: 'Sicurezza | Ebartex',
  description: 'Autenticazione a due fattori e impostazioni di sicurezza',
};

export default function SicurezzaPage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><MascotteLoader size="sm" /></div>}>
      <SicurezzaContent />
    </Suspense>
  );
}
