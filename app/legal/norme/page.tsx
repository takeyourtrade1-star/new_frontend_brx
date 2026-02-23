import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata = {
  title: 'Norme legali | Ebartex',
  description: 'Norme legali e regolamento del marketplace Ebartex',
};

export default function NormeLegaliPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1 text-sm text-white/90 hover:text-white hover:underline"
      >
        <ChevronLeft className="h-4 w-4" />
        Torna alla home
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold text-white md:text-3xl">
        Norme legali
      </h1>
      <p className="mb-4 text-sm text-white/80">
        Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
      </p>
      <div className="space-y-6 text-sm text-white/90">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">1. Riferimenti normativi</h2>
          <p>
            Il marketplace Ebartex opera nel rispetto della normativa applicabile in materia
            di commercio elettronico, protezione dei dati e diritti dei consumatori.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">2. Regolamento di utilizzo</h2>
          <p>
            L&apos;utilizzo della piattaforma è soggetto alle norme indicate nei Termini e condizioni,
            nella Privacy policy e nella Cookie policy, consultabili nelle rispettive sezioni.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">3. Contatti</h2>
          <p>
            Per richieste di carattere legale o conformità è possibile contattare
            il titolare del trattamento tramite i canali indicati nella Privacy policy.
          </p>
        </section>
      </div>
    </div>
  );
}
