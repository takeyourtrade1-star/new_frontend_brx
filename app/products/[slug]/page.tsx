import { ProductDetailView } from '@/components/feature/product/ProductDetailView';
import { getCardBySlug } from '@/lib/mock-cards';
import { getCardDocumentById, isIndexProductId } from '@/lib/product-detail';

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const cardId = resolvedParams.slug;

  // Id da ricerca (Meilisearch): mtg_123, op_456, pk_789, sealed_10 → fetch da Meilisearch (GET doc + fallback search)
  if (isIndexProductId(cardId)) {
    const cardData = await getCardDocumentById(cardId);

    if (!cardData) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center text-white">
          <p>Carta non trovata</p>
        </div>
      );
    }

    return <ProductDetailView card={cardData} />;
  }

  // Fallback: carta mock (slug tipo mowgli-cucciolo-duomo)
  const card = getCardBySlug(cardId);

  if (!card) {
    return (
      <ProductDetailView
        slug={cardId}
        title="MOWGLI - CUCCIOLO D'UOMO"
        subtitle="SUSSURRI NEL POZZO - MOWGLI - MAN CUB - SINGLES"
        breadcrumbs={[
          { label: 'MAGIC: THE GATHERING', href: '/products' },
          { label: 'SINGLES', href: '/products?category=singles' },
          { label: 'ECLISSI DI QUALCOSA', href: '#' },
          { label: 'STORMO DELLA SCISSIONE', href: '#' },
        ]}
        imageSrc="/images/kyurem.png"
      />
    );
  }

  const title = card.nameLocalized?.it?.toUpperCase() || card.name.toUpperCase();
  const subtitle = `${card.set} - ${card.name} - ${card.type}`;

  return (
    <ProductDetailView
      slug={card.slug}
      title={title}
      subtitle={subtitle}
      breadcrumbs={card.breadcrumbs}
      imageSrc={card.imageUrl}
    />
  );
}
