import { redirect } from 'next/navigation';
import { getVendiCatalogHref } from '@/lib/sell-flow/sell-flow';

export default function VendiSetEdizioniRedirectPage() {
  redirect(getVendiCatalogHref('/products/set-lotti-collezioni'));
}
