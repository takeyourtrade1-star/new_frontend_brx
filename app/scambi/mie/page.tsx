import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Scambi in corso | Ebartex',
};

// "Scambi in corso" è ora la pagina principale degli scambi (/scambi).
// Manteniamo /scambi/mie come redirect per non rompere i link esistenti.
export default function MieiScambiPage() {
  redirect('/scambi');
}
