import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { ChevronLeft } from 'lucide-react';

export const metadata = {
  title: 'Aiuto e FAQ | Ebartex',
  description: 'Domande frequenti e guide su come usare Ebartex',
};

export default function AiutoPage() {
  return (
    <div className="min-h-screen font-sans text-white" style={{ backgroundColor: '#3D65C6' }}>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10 md:py-14">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-white/90 hover:text-white hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Torna alla home
        </Link>
        <h1 className="mb-8 font-display text-2xl font-bold text-white md:text-3xl">
          Aiuto e FAQ
        </h1>

        <section id="condizioni" className="scroll-mt-8 border-b border-white/20 pb-8">
          <h2 className="mb-4 text-lg font-semibold text-white">Guida alle condizioni</h2>
          <p className="mb-2 text-sm text-white/80">
            Le condizioni delle carte seguono gli standard di mercato. Consulta
            la nostra guida nelle pagine legali.
          </p>
          <Link href="/legal/condizioni" className="text-sm text-white/90 hover:text-white hover:underline">
            Termini e condizioni
          </Link>
        </section>

        <section id="comprare" className="scroll-mt-8 border-b border-white/20 py-8">
          <h2 className="mb-4 text-lg font-semibold text-white">Come comprare</h2>
          <ol className="list-inside list-decimal space-y-2 text-sm text-white/80">
            <li>Registrati o accedi al tuo account.</li>
            <li>Cerca le carte o i prodotti che ti interessano.</li>
            <li>Aggiungi al carrello e procedi al checkout.</li>
            <li>Scegli il metodo di pagamento e conferma.</li>
          </ol>
        </section>

        <section id="spedizione" className="scroll-mt-8 py-8">
          <h2 className="mb-4 text-lg font-semibold text-white">Metodi di spedizione</h2>
          <p className="text-sm text-white/80">
            I tempi e i costi dipendono dal venditore. In genere la spedizione
            avviene in 2–5 giorni lavorativi per l&apos;Italia.
          </p>
        </section>
      </main>
    </div>
  );
}
