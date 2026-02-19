import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata = {
  title: 'Termini e condizioni di utilizzo | Ebartex',
  description: 'Termini e condizioni di utilizzo del marketplace Ebartex',
};

export default function TerminiCondizioniPage() {
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
        Termini e condizioni di utilizzo
      </h1>
      <p className="mb-4 text-sm text-white/80">
        Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
      </p>
      <div className="space-y-6 text-sm text-white/90">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">1. Accettazione dei termini</h2>
          <p>
            L&apos;utilizzo del sito e dei servizi Ebartex implica l&apos;accettazione
            integrale dei presenti termini e condizioni.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">2. Descrizione del servizio</h2>
          <p>
            Ebartex è un marketplace per carte collezionabili che mette in relazione
            acquirenti e venditori.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">3. Registrazione e account</h2>
          <p>
            Per acquistare o vendere è necessario registrarsi e mantenere dati
            corretti e aggiornati.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">4. Condotte vietate</h2>
          <p>
            È vietato utilizzare la piattaforma per scopi illeciti o violare
            diritti di terzi.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">5. Modifiche</h2>
          <p>
            I presenti termini possono essere aggiornati. La prosecuzione
            dell&apos;uso del servizio costituisce accettazione delle nuove condizioni.
          </p>
        </section>
      </div>
    </div>
  );
}
