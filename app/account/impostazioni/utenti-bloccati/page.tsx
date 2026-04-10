import { Suspense } from 'react';
import { UtentiBloccatiContent } from '@/components/feature/account/UtentiBloccatiContent';

export const metadata = {
  title: 'Utenti bloccati | Ebartex',
  description: 'Gestisci la lista utenti bloccati',
};

export default function UtentiBloccatiPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Caricamento...</div>}>
      <UtentiBloccatiContent />
    </Suspense>
  );
}
