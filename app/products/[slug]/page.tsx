import { ProductDetailView } from '@/components/feature/product/ProductDetailView';
import { ProductCategoryPageClient } from '@/components/feature/product/ProductCategoryPageClient';
import { EbartexBoutiquePage } from '@/components/feature/product/EbartexBoutiquePage';
import { MissingPage } from '@/components/shared/MissingPage';
import { Suspense, cache, type ComponentProps } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getCdnImageUrl, SITE_URL } from '@/lib/config';
import { getCardImageUrl } from '@/lib/assets';
import { getCardBySlug } from '@/lib/mock-cards';
import { getCardDocumentById, isIndexProductId, type CardDocument } from '@/lib/product-detail';
import { CATEGORY_SLUGS, type ProductCategorySlug } from '@/lib/product-categories';

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

/** Memoizzato per-request: condiviso tra generateMetadata e la pagina, così la
 *  carta viene recuperata una sola volta per richiesta (getCardDocumentById usa
 *  `cache: 'no-store'`, quindi senza questo ci sarebbero 2 fetch Meili). */
const getCard = cache(getCardDocumentById);

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;

  // Solo i prodotti del catalogo (id Meili) hanno metadata ricchi; per
  // boutique/categorie/mock restano i default del root layout.
  if (!isIndexProductId(slug)) {
    return {};
  }

  const card = await getCard(slug);
  if (!card) {
    return { title: 'Prodotto non trovato | Ebartex', robots: { index: false } };
  }

  const ogImage = getCardImageUrl(card.image);
  const titleBase = card.set_name ? `${card.name} (${card.set_name})` : card.name;

  return {
    title: `${titleBase} | Ebartex`,
    description: `Compra ${card.name}${
      card.set_name ? ` da ${card.set_name}` : ''
    } su Ebartex: prezzi, venditori e aste.`,
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      title: card.name,
      description: `${card.set_name || 'Carta collezionabile'} · Ebartex`,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  };
}

/** JSON-LD BreadcrumbList per la rich result di Google sulla pagina prodotto. */
function ProductBreadcrumbJsonLd({ card, slug }: { card: CardDocument; slug: string }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Prodotti', item: `${SITE_URL}/products` },
      { '@type': 'ListItem', position: 3, name: card.name, item: `${SITE_URL}/products/${slug}` },
    ],
  };
  // Escape di `<` per non poter chiudere il tag <script> con dati dal catalogo.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

function ProductDetailWithSuspense(
  props: ComponentProps<typeof ProductDetailView>,
) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-white">
          <p>Caricamento…</p>
        </div>
      }
    >
      <ProductDetailView {...props} />
    </Suspense>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  // Ebartex Boutique: pagina dedicata con carousel, categorie, stampa 3D
  if (slug === 'boutique') {
    return <EbartexBoutiquePage />;
  }

  // Slug categoria (singles, boosters, sigillati, ecc.) → pagina elenco categoria
  if (CATEGORY_SLUGS.has(slug)) {
    return <ProductCategoryPageClient categorySlug={slug as ProductCategorySlug} />;
  }

  const cardId = slug;

  // Id da ricerca (Meilisearch): mtg_123, op_456, pk_789, sealed_10 → fetch da Meilisearch (GET doc + fallback search)
  if (isIndexProductId(cardId)) {
    const cardData = await getCard(cardId);

    if (!cardData) {
      return (
        <MissingPage
          className="min-h-[40vh]"
          title="Carta non trovata"
          description="La carta che stai cercando non esiste o non è più disponibile."
          actions={
            <Link
              href="/"
              className="rounded-md bg-[var(--color-brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Torna alla home
            </Link>
          }
        />
      );
    }

    return (
      <>
        <ProductBreadcrumbJsonLd card={cardData} slug={cardId} />
        <ProductDetailWithSuspense card={cardData} />
      </>
    );
  }

  // Fallback: carta mock (slug tipo mowgli-cucciolo-duomo)
  const card = getCardBySlug(cardId);

  if (!card) {
    return (
      <ProductDetailWithSuspense
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
    <ProductDetailWithSuspense
      slug={card.slug}
      title={title}
      subtitle={subtitle}
      breadcrumbs={card.breadcrumbs}
      imageSrc={card.imageUrl}
    />
  );
}
