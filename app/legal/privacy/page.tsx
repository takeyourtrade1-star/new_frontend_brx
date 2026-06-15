import { LegalDocShell } from '@/components/legal/LegalDocShell';
import { PrivacyPolicyContent } from '@/components/legal/PrivacyPolicyContent';
import { TERMS_LAST_UPDATED } from '@/lib/legal/company-info';

export const metadata = {
  title: 'Privacy Policy | Ebartex',
  description: 'Informativa sulla privacy e protezione dei dati personali della piattaforma Ebartex',
};

export default function PrivacyPage() {
  return (
    <LegalDocShell titleKey="legal.privacy.title" lastUpdated={TERMS_LAST_UPDATED}>
      <PrivacyPolicyContent />
    </LegalDocShell>
  );
}
