import { ListaDesideriContent } from '@/components/feature/account/ListaDesideriContent';
import { PrestoInArrivoBanner } from '@/components/feature/account/PrestoInArrivoBanner';

export const metadata = {
  title: 'Lista desideri | Account | Ebartex',
  description: 'Gestisci le tue wantlist di carte',
};

export default function ListaDesideriPage() {
  return (
    <>
      <PrestoInArrivoBanner />
      <ListaDesideriContent />
    </>
  );
}
