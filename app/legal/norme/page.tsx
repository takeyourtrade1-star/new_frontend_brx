import { LegalDocShell } from '@/components/legal/LegalDocShell';

export const metadata = {
  title: 'Norme legali | Ebartex',
  description: 'Norme legali e regolamento del marketplace Ebartex',
};

export default function NormeLegaliPage() {
  return (
    <LegalDocShell titleKey="legal.rules.title">
      <section>
        <h2 className="mb-2 text-lg font-semibold text-white">1. Riferimenti normativi</h2>
        <p>
          Il marketplace Ebartex opera nel rispetto della normativa applicabile in materia di commercio elettronico,
          protezione dei dati e diritti dei consumatori.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-semibold text-white">2. Regolamento di utilizzo</h2>
        <p>
          L&apos;utilizzo della piattaforma è soggetto alle norme indicate nei Termini e condizioni, nella Privacy
          policy e nella Cookie policy, consultabili nelle rispettive sezioni.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-semibold text-white">3. Contatti</h2>
        <p>
          Per richieste di carattere legale o conformità è possibile contattare il titolare del trattamento tramite i
          canali indicati nella Privacy policy.
        </p>
      </section>
    </LegalDocShell>
  );
}
