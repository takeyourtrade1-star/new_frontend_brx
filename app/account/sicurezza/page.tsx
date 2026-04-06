import dynamic from 'next/dynamic';

const SicurezzaContent = dynamic(
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
  return <SicurezzaContent />;
}
