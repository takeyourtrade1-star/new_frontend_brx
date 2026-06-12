import { LegalDocShell } from '@/components/legal/LegalDocShell';
import { LegalCompanyNotice } from '@/components/legal/LegalCompanyNotice';
import {
  LegalSection,
  LegalH2,
  LegalP,
  LegalInlineLink,
} from '@/components/legal/LegalTypography';
import { COMPANY_INFO, TERMS_LAST_UPDATED } from '@/lib/legal/company-info';

export const metadata = {
  title: 'Norme legali | Ebartex',
  description: 'Norme legali e regolamento del marketplace Ebartex',
};

export default function NormeLegaliPage() {
  return (
    <LegalDocShell titleKey="legal.rules.title" lastUpdated={TERMS_LAST_UPDATED}>
      <LegalSection>
        <LegalH2>1. Operatore del servizio</LegalH2>
        <LegalP>
          Il servizio {COMPANY_INFO.tradeName} è gestito da {COMPANY_INFO.legalName}, accessibile tramite{' '}
          <LegalInlineLink href={COMPANY_INFO.websiteUrl} external>
            {COMPANY_INFO.website}
          </LegalInlineLink>
          .
        </LegalP>
        <LegalCompanyNotice />
      </LegalSection>

      <LegalSection>
        <LegalH2>2. Riferimenti normativi</LegalH2>
        <LegalP>
          Il marketplace Ebartex opera nel rispetto della normativa applicabile in materia di commercio elettronico,
          protezione dei dati personali e diritti dei consumatori.
        </LegalP>
      </LegalSection>

      <LegalSection>
        <LegalH2>3. Regolamento di utilizzo</LegalH2>
        <LegalP>
          L&apos;utilizzo della piattaforma è soggetto ai{' '}
          <LegalInlineLink href="/legal/condizioni">Termini e Condizioni di Servizio</LegalInlineLink>, alla{' '}
          <LegalInlineLink href="/legal/privacy">Privacy Policy</LegalInlineLink> e alla{' '}
          <LegalInlineLink href="/legal/cookie">Cookie Policy</LegalInlineLink>.
        </LegalP>
      </LegalSection>

      <LegalSection>
        <LegalH2>4. Contatti</LegalH2>
        <LegalP>
          Per richieste di carattere legale o conformità è possibile contattare il titolare tramite PEC{' '}
          <LegalInlineLink href={`mailto:${COMPANY_INFO.pec}`}>{COMPANY_INFO.pec}</LegalInlineLink> o la pagina{' '}
          <LegalInlineLink href="/contatti">Contattaci</LegalInlineLink>.
        </LegalP>
      </LegalSection>
    </LegalDocShell>
  );
}
