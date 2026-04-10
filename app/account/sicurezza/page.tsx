import { Suspense } from 'react';
import dynamicImport from 'next/dynamic';

export const dynamic = 'force-dynamic';

const SicurezzaContent = dynamicImport(
  () => import('@/components/feature/account/SicurezzaContent').then((mod) => ({ default: mod.SicurezzaContent })),
  {
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-lg font-medium text-gray-500 animate-pulse">
          Caricamento impostazioni sicurezza...
        </div>
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
    <Suspense fallback={<div className="p-8 text-center">Caricamento...</div>}>
      <SicurezzaContent />
    </Suspense>
  );
}
