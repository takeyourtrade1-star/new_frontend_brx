import { ListaDesideriDetailContent } from '@/components/feature/account/ListaDesideriDetailContent';

export default function ListaDesideriDetailPage({ params }: { params: { id: string } }) {
  return <ListaDesideriDetailContent listId={params.id} />;
}
