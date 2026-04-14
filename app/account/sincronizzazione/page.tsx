import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { MascotteLoader } from '@/components/dev/MascotteLoader';

const SincronizzazioneContent = dynamic(
  () => import('@/components/feature/account/SincronizzazioneContent').then((mod) => ({ default: mod.SincronizzazioneContent })),
  {
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center">
        <MascotteLoader size="sm" />
      </div>
    ),
  }
);

export const metadata = {
  title: 'Sincronizzazione | Account | Ebartex',
  description: 'Sincronizzazione dati e collezione',
};

export default function SincronizzazionePage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><MascotteLoader size="sm" /></div>}>
      <SincronizzazioneContent />
    </Suspense>
  );
}
