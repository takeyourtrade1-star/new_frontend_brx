import Link from 'next/link';
import { LegalDocShell } from '@/components/legal/LegalDocShell';
import { LegalCompanyNotice } from '@/components/legal/LegalCompanyNotice';
import { COMPANY_INFO, TERMS_LAST_UPDATED } from '@/lib/legal/company-info';

export const metadata = {
  title: 'Norme legali | Ebartex',
  description: 'Norme legali e regolamento del marketplace Ebartex',
};

export default function NormeLegaliPage() {
  return (
    <LegalDocShell titleKey="legal.rules.title" lastUpdated={TERMS_LAST_UPDATED}>
      <section>
        <h2 className="mb-2 text-lg font-semibold text-white">1. Operatore del servizio</h2>
        <p className="mb-4">
          Il servizio {COMPANY_INFO.tradeName} è gestito da {COMPANY_INFO.legalName}, accessibile tramite{' '}
          <a href={COMPANY_INFO.websiteUrl} className="underline hover:text-white">
            {COMPANY_INFO.website}
          </a>
          .
        </p>
        <LegalCompanyNotice />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-white">2. Riferimenti normativi</h2>
        <p>
          Il marketplace Ebartex opera nel rispetto della normativa applicabile in materia di commercio elettronico,
          protezione dei dati personali e diritti dei consumatori.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-white">3. Regolamento di utilizzo</h2>
        <p>
          L&apos;utilizzo della piattaforma è soggetto ai{' '}
          <Link href="/legal/condizioni" className="underline hover:text-white">
            Termini e Condizioni di Servizio
          </Link>
          , alla{' '}
          <Link href="/legal/privacy" className="underline hover:text-white">
            Privacy Policy
          </Link>{' '}
          e alla{' '}
          <Link href="/legal/cookie" className="underline hover:text-white">
            Cookie Policy
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-white">4. Contatti</h2>
        <p>
          Per richieste di carattere legale o conformità è possibile contattare il titolare tramite PEC{' '}
          <a href={`mailto:${COMPANY_INFO.pec}`} className="underline hover:text-white">
            {COMPANY_INFO.pec}
          </a>{' '}
          o la pagina{' '}
          <Link href="/contatti" className="underline hover:text-white">
            Contattaci
          </Link>
          .
        </p>
      </section>
    </LegalDocShell>
  );
}
