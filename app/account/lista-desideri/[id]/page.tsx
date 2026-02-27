import { ListaDesideriDetailContent } from '@/components/feature/account/ListaDesideriDetailContent';

export default async function ListaDesideriDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListaDesideriDetailContent listId={id} />;
}
