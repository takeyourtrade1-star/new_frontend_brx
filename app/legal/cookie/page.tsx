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
  title: 'Cookie Policy | Ebartex',
  description: "Informativa sull'uso dei cookie sul sito Ebartex",
};

export default function CookiePage() {
  return (
    <LegalDocShell titleKey="legal.cookie.title" lastUpdated={TERMS_LAST_UPDATED}>
      <LegalSection>
        <LegalH2>1. Titolare</LegalH2>
        <LegalP>
          Il titolare del trattamento tramite cookie è {COMPANY_INFO.legalName}, gestore della piattaforma{' '}
          {COMPANY_INFO.tradeName}.
        </LegalP>
        <LegalCompanyNotice />
      </LegalSection>

      <LegalSection>
        <LegalH2>2. Cosa sono i cookie</LegalH2>
        <LegalP>
          I cookie sono piccoli file di testo che i siti memorizzano sul tuo dispositivo. Vengono utilizzati per
          ricordare preferenze, migliorare la navigazione e analizzare l&apos;utilizzo del sito in modo aggregato.
        </LegalP>
      </LegalSection>

      <LegalSection>
        <LegalH2>3. Tipi di cookie utilizzati</LegalH2>
        <LegalP>
          Utilizziamo cookie tecnici necessari al funzionamento del sito (es. sessione, lingua, tema), cookie di
          preferenze e, con il tuo consenso, cookie analitici per statistiche anonime. Non utilizziamo cookie di
          profilazione pubblicitaria senza consenso esplicito.
        </LegalP>
      </LegalSection>

      <LegalSection>
        <LegalH2>4. Gestione e revoca</LegalH2>
        <LegalP>
          Puoi gestire o disattivare i cookie dalle impostazioni del browser. La disattivazione di cookie tecnici può
          limitare alcune funzionalità del sito. Le preferenze sui cookie possono essere modificate in qualsiasi
          momento dal banner di primo accesso.
        </LegalP>
      </LegalSection>

      <LegalSection>
        <LegalH2>5. Cookie di terze parti</LegalH2>
        <LegalP>
          In presenza di servizi di terze parti (es. mappe, video, statistiche), tali soggetti possono impostare
          propri cookie. Per le relative informative si rimanda ai siti delle terze parti e alla{' '}
          <LegalInlineLink href="/legal/privacy">Privacy Policy</LegalInlineLink>.
        </LegalP>
      </LegalSection>
    </LegalDocShell>
  );
}
