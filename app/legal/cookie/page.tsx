import { LegalDocShell } from '@/components/legal/LegalDocShell';

export const metadata = {
  title: 'Cookie Policy | Ebartex',
  description: "Informativa sull'uso dei cookie sul sito Ebartex",
};

export default function CookiePage() {
  return (
    <LegalDocShell titleKey="legal.cookie.title">
      <section>
        <h2 className="mb-2 text-lg font-semibold text-white">1. Cosa sono i cookie</h2>
        <p>
          I cookie sono piccoli file di testo che i siti memorizzano sul tuo dispositivo. Vengono utilizzati per
          ricordare preferenze, migliorare la navigazione e analizzare l&apos;utilizzo del sito in modo aggregato.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-semibold text-white">2. Tipi di cookie utilizzati</h2>
        <p>
          Utilizziamo cookie tecnici necessari al funzionamento del sito (es. sessione, lingua, tema), cookie di
          preferenze e, con il tuo consenso, cookie analitici per statistiche anonime. Non utilizziamo cookie di
          profilazione pubblicitaria senza consenso esplicito.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-semibold text-white">3. Gestione e revoca</h2>
        <p>
          Puoi gestire o disattivare i cookie dalle impostazioni del browser. La disattivazione di cookie tecnici può
          limitare alcune funzionalità del sito. Le preferenze sui cookie possono essere modificate in qualsiasi
          momento dalla pagina Preferenze Privacy o dal banner di primo accesso.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-semibold text-white">4. Cookie di terze parti</h2>
        <p>
          In presenza di servizi di terze parti (es. mappe, video, statistiche), tali soggetti possono impostare
          propri cookie. Per le relative informative si rimanda ai siti delle terze parti.
        </p>
      </section>
    </LegalDocShell>
  );
}
