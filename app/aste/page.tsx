import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata = {
  title: 'Aste | Ebartex',
  description: 'Partecipa alle aste di carte collezionabili su Ebartex',
};

export default function AstePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 md:py-20 text-center">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1 text-sm text-white/90 hover:text-white hover:underline"
      >
        <ChevronLeft className="h-4 w-4" />
        Torna alla home
      </Link>
      <h1 className="mb-4 font-display text-2xl font-bold text-white md:text-3xl">
        Aste
      </h1>
      <p className="text-white/80">
        La sezione aste è in arrivo. Presto potrai partecipare alle aste per le tue carte preferite.
      </p>
    </div>
  );
}
