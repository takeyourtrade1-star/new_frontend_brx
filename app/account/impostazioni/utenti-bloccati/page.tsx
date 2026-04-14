import { Suspense } from 'react';
import { UtentiBloccatiContent } from '@/components/feature/account/UtentiBloccatiContent';
import { MascotteLoader } from '@/components/dev/MascotteLoader';

export const metadata = {
  title: 'Utenti bloccati | Ebartex',
  description: 'Gestisci la lista utenti bloccati',
};

export default function UtentiBloccatiPage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><MascotteLoader size="sm" /></div>}>
      <UtentiBloccatiContent />
    </Suspense>
  );
}
