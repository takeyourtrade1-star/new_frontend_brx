import { LegalDocShell } from '@/components/legal/LegalDocShell';

export const metadata = {
  title: 'Privacy Policy | Ebartex',
  description: 'Informativa sulla privacy e protezione dei dati personali Ebartex',
};

export default function PrivacyPage() {
  return (
    <LegalDocShell titleKey="legal.privacy.title">
      <section>
        <h2 className="mb-2 text-lg font-semibold text-white">1. Titolare del trattamento</h2>
        <p>
          Il titolare del trattamento dei dati personali è Ebartex. Per esercitare i diritti previsti dal GDPR
          (accesso, rettifica, cancellazione, limitazione, portabilità, opposizione) è possibile contattarci tramite
          la pagina Contattaci o l&apos;email indicata in sede.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-semibold text-white">2. Dati raccolti</h2>
        <p>
          Raccogliamo i dati forniti in fase di registrazione (email, nome, indirizzo, dati di pagamento ove
          applicabile), i dati di navigazione e utilizzo della piattaforma e, con il consenso, cookie e tecnologie
          simili per migliorare il servizio e la sicurezza.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-semibold text-white">3. Finalità e base giuridica</h2>
        <p>
          I dati sono trattati per l&apos;esecuzione del contratto (vendita e acquisto), adempimenti di legge,
          legittimo interesse (sicurezza, antifrode) e, ove richiesto, consenso per marketing e profilazione.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-semibold text-white">4. Conservazione e sicurezza</h2>
        <p>
          I dati sono conservati per il tempo necessario alle finalità indicate o imposto dalla legge. Adottiamo
          misure tecniche e organizzative adeguate per proteggere i dati da accessi non autorizzati e perdite.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-semibold text-white">5. Diritti e reclami</h2>
        <p>
          Oltre ai diritti GDPR, è possibile proporre reclamo all&apos;Autorità Garante per la Protezione dei Dati
          Personali italiana. Per dettagli su cookie e tecnologie simili si rimanda alla Cookie Policy.
        </p>
      </section>
    </LegalDocShell>
  );
}
