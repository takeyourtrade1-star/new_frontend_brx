import { ProductsPageClient } from './products-page-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prodotti | Catalogo Ebartex',
  description:
    'Sfoglia il catalogo completo di prodotti Ebartex: booster box, bustine, carte singole e accessori.',
};

export default function ProductsPage() {
  return <ProductsPageClient />;
}
