import { redirect } from 'next/navigation';

/** Vendita singole: wizard embedded nel tab VENDI della scheda prodotto. */
export default function VendiSingoleRedirectPage() {
  redirect('/products/singles');
}
