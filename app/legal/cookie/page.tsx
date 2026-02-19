import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata = {
  title: 'Cookie Policy | Ebartex',
  description: 'Informativa sull\'uso dei cookie sul sito Ebartex',
};

export default function CookiePage() {
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
        Cookie Policy
      </h1>
      <p className="mb-4 text-sm text-white/80">
        Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
      </p>
      <div className="max-w-none space-y-6 text-sm text-white/90">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">1. Cosa sono i cookie</h2>
          <p>
            I cookie sono piccoli file di testo che i siti memorizzano sul tuo
            dispositivo. Vengono utilizzati per ricordare preferenze, migliorare
            la navigazione e analizzare l&apos;utilizzo del sito in modo
            aggregato.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">2. Tipi di cookie utilizzati</h2>
          <p>
            Utilizziamo cookie tecnici necessari al funzionamento del sito
            (es. sessione, lingua, tema), cookie di preferenze e, con il tuo
            consenso, cookie analitici per statistiche anonime. Non utilizziamo
            cookie di profilazione pubblicitaria senza consenso esplicito.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">3. Gestione e revoca</h2>
          <p>
            Puoi gestire o disattivare i cookie dalle impostazioni del browser.
            La disattivazione di cookie tecnici può limitare alcune
            funzionalità del sito. Le preferenze sui cookie possono essere
            modificate in qualsiasi momento dalla pagina Preferenze Privacy o
            dal banner di primo accesso.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">4. Cookie di terze parti</h2>
          <p>
            In presenza di servizi di terze parti (es. mappe, video,
            statistiche), tali soggetti possono impostare propri cookie. Per
            le relative informative si rimanda ai siti delle terze parti.
          </p>
        </section>
      </div>
    </div>
  );
}
