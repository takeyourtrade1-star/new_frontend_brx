import { redirect } from 'next/navigation';

export default function AsteSpedizioniRedirectPage() {
  redirect('/ordini/vendite?tab=da-spedire');
}
