import { Suspense } from 'react';
import { LegalDocShell } from '@/components/legal/LegalDocShell';
import { TermsOfServiceContent } from '@/components/legal/TermsOfServiceContent';
import { TERMS_LAST_UPDATED } from '@/lib/legal/company-info';

export const metadata = {
  title: 'Termini e Condizioni di Servizio | Ebartex',
  description: 'Termini e Condizioni di Servizio della piattaforma Ebartex',
};

export default function TerminiCondizioniPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Caricamento...</div>}>
      <LegalDocShell titleKey="legal.terms.pageTitle" lastUpdated={TERMS_LAST_UPDATED}>
        <TermsOfServiceContent />
      </LegalDocShell>
    </Suspense>
  );
}
