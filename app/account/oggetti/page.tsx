import { Suspense } from 'react';
import { OggettiContent } from '@/components/feature/account/OggettiContent';

export const metadata = {
  title: 'I miei oggetti | Account | Ebartex',
  description: 'La tua collezione di oggetti',
};

export default function OggettiPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Caricamento...</div>}>
      <OggettiContent />
    </Suspense>
  );
}
