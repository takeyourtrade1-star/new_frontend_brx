import dynamic from 'next/dynamic';

const SincronizzazioneContent = dynamic(
  () => import('@/components/feature/account/SincronizzazioneContent').then((mod) => ({ default: mod.SincronizzazioneContent })),
  {
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-lg font-medium text-gray-500 animate-pulse">
          Caricamento sincronizzazione...
        </div>
      </div>
    ),
  }
);

export const metadata = {
  title: 'Sincronizzazione | Account | Ebartex',
  description: 'Sincronizzazione dati e collezione',
};

export default function SincronizzazionePage() {
  return <SincronizzazioneContent />;
}
