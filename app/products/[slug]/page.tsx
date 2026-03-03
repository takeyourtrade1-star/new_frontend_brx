import { ProductDetailView } from '@/components/feature/product/ProductDetailView';
import { ProductCategoryPageClient } from '@/components/feature/product/ProductCategoryPageClient';
import { EbartexBoutiquePage } from '@/components/feature/product/EbartexBoutiquePage';
import { getCdnImageUrl } from '@/lib/config';
import { getCardBySlug } from '@/lib/mock-cards';
import { getCardDocumentById, isIndexProductId } from '@/lib/product-detail';
import { CATEGORY_SLUGS } from '@/lib/product-categories';

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  // Ebartex Boutique: pagina dedicata con carousel, categorie, stampa 3D
  if (slug === 'boutique') {
    return <EbartexBoutiquePage />;
  }

  // Slug categoria (singles, boosters, sigillati, ecc.) → pagina elenco categoria
  if (CATEGORY_SLUGS.has(slug)) {
    return <ProductCategoryPageClient categorySlug={slug} />;
  }

  const cardId = slug;

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
        imageSrc={getCdnImageUrl('kyurem.png')}
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
