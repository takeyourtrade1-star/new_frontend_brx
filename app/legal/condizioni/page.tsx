import { Suspense } from 'react';
import { LegalDocShell } from '@/components/legal/LegalDocShell';

export const metadata = {
  title: 'Termini e condizioni di utilizzo | Ebartex',
  description: 'Termini e condizioni di utilizzo del marketplace Ebartex',
};

export default function TerminiCondizioniPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Caricamento...</div>}>
      <LegalDocShell titleKey="legal.terms.pageTitle">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">1. Accettazione dei termini</h2>
          <p>
            L&apos;utilizzo del sito e dei servizi Ebartex implica l&apos;accettazione integrale dei presenti termini e
            condizioni.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">2. Descrizione del servizio</h2>
          <p>Ebartex è un marketplace per carte collezionabili che mette in relazione acquirenti e venditori.</p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">3. Registrazione e account</h2>
          <p>Per acquistare o vendere è necessario registrarsi e mantenere dati corretti e aggiornati.</p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">4. Condotte vietate</h2>
          <p>È vietato utilizzare la piattaforma per scopi illeciti o violare diritti di terzi.</p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">5. Modifiche</h2>
          <p>
            I presenti termini possono essere aggiornati. La prosecuzione dell&apos;uso del servizio costituisce
            accettazione delle nuove condizioni.
          </p>
        </section>
      </LegalDocShell>
    </Suspense>
  );
}
