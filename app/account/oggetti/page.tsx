import { Suspense } from 'react';
import { OggettiContent } from '@/components/feature/account/OggettiContent';
import { MascotteLoader } from '@/components/dev/MascotteLoader';

export const metadata = {
  title: 'I miei oggetti | Account | Ebartex',
  description: 'La tua collezione di oggetti',
};

export default function OggettiPage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><MascotteLoader size="sm" /></div>}>
      <OggettiContent />
    </Suspense>
  );
}
