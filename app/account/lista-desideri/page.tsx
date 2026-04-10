import { ListaDesideriContent } from '@/components/feature/account/ListaDesideriContent';

export const metadata = {
  title: 'Lista desideri | Account | Ebartex',
  description: 'Gestisci le tue wantlist di carte',
};

export default function ListaDesideriPage() {
  return (
    <div className="pointer-events-none opacity-60">
      <ListaDesideriContent />
    </div>
  );
}
