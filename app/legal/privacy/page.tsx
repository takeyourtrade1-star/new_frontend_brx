import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Ebartex',
  description: 'Informativa sulla privacy e protezione dei dati personali Ebartex',
};

export default function PrivacyPage() {
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
        Privacy Policy
      </h1>
      <p className="mb-4 text-sm text-white/80">
        Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
      </p>
      <div className="max-w-none space-y-6 text-sm text-white/90">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">1. Titolare del trattamento</h2>
          <p>
            Il titolare del trattamento dei dati personali è Ebartex. Per
            esercitare i diritti previsti dal GDPR (accesso, rettifica,
            cancellazione, limitazione, portabilità, opposizione) è possibile
            contattarci tramite la pagina Contattaci o l&apos;email indicata in sede.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">2. Dati raccolti</h2>
          <p>
            Raccogliamo i dati forniti in fase di registrazione (email, nome,
            indirizzo, dati di pagamento ove applicabile), i dati di navigazione
            e utilizzo della piattaforma e, con il consenso, cookie e tecnologie
            simili per migliorare il servizio e la sicurezza.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">3. Finalità e base giuridica</h2>
          <p>
            I dati sono trattati per l&apos;esecuzione del contratto (vendita e
            acquisto), adempimenti di legge, legittimo interesse (sicurezza,
            antifrode) e, ove richiesto, consenso per marketing e profilazione.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">4. Conservazione e sicurezza</h2>
          <p>
            I dati sono conservati per il tempo necessario alle finalità
            indicate o imposto dalla legge. Adottiamo misure tecniche e
            organizzative adeguate per proteggere i dati da accessi non
            autorizzati e perdite.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-white">5. Diritti e reclami</h2>
          <p>
            Oltre ai diritti GDPR, è possibile proporre reclamo all&apos;Autorità
            Garante per la Protezione dei Dati Personali italiana. Per
            dettagli su cookie e tecnologie simili si rimanda alla Cookie Policy.
          </p>
        </section>
      </div>
    </div>
  );
}
