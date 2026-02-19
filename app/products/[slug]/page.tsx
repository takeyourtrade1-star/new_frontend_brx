import { ProductDetailView } from '@/components/feature/product/ProductDetailView';
import { getCardBySlug } from '@/lib/mock-cards';

type ProductPageProps = {
  params: { slug: string };
};

export default function ProductPage({ params }: ProductPageProps) {
  const { slug } = params;
  
  // Cerca la carta nei dati mock
  const card = getCardBySlug(slug);
  
  // Se la carta non esiste, usa i dati di default (Mowgli)
  if (!card) {
    return (
      <ProductDetailView
        slug={slug}
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
  
  // Usa i dati della carta trovata
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
