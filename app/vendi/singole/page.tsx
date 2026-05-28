import { redirect } from 'next/navigation';
import { getVendiCatalogHref } from '@/lib/sell-flow/sell-flow';

/** Vendita singole: wizard embedded nel tab VENDI della scheda prodotto. */
export default function VendiSingoleRedirectPage() {
  redirect(getVendiCatalogHref('/products/singles'));
}
