import { Suspense } from 'react';
import { ListaDesideriContent } from '@/components/feature/account/ListaDesideriContent';
import { MascotteLoader } from '@/components/dev/MascotteLoader';

export const metadata = {
  title: 'Lista desideri | Account | Ebartex',
  description: 'Gestisci le tue wantlist di carte',
};

export default function ListaDesideriPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><MascotteLoader size="sm" /></div>}>
      <ListaDesideriContent />
    </Suspense>
  );
}
