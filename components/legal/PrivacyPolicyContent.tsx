import Link from 'next/link';
import { COMPANY_INFO, TERMS_LAST_UPDATED } from '@/lib/legal/company-info';

function P({ children }: { children: React.ReactNode }) {
  return <p className="leading-relaxed">{children}</p>;
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 text-lg font-semibold text-white">{children}</h2>;
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-1 text-base font-semibold text-white">{children}</h3>;
}

function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-1 pl-5">{children}</ul>;
}

export function PrivacyPolicyContent() {
  const { legalName, tradeName, website, websiteUrl, legalAddress, pec, vatNumber, rea, legalForm } = COMPANY_INFO;

  return (
    <div className="space-y-6">
      <section>
        <p className="text-base font-semibold uppercase tracking-wide text-white">
          Informativa sulla Privacy – {tradeName}
        </p>
        <p className="mt-2 text-sm text-white/80">Ultimo aggiornamento: {TERMS_LAST_UPDATED}</p>
      </section>

      <section className="space-y-3">
        <H2>1. Premessa e ambito di applicazione</H2>
        <P>
          La presente Informativa sulla Privacy (di seguito &quot;Informativa&quot;) descrive le modalità con cui{' '}
          {legalName} (di seguito il &quot;Titolare&quot;) tratta i dati personali degli utenti che accedono e utilizzano la
          piattaforma {tradeName}, disponibile su{' '}
          <a href={websiteUrl} className="underline hover:text-white">
            {website}
          </a>{' '}
          e sui relativi sottodomini, incluse le funzionalità di mercato, aste, sincronizzazione inventari, ricerca,
          account utente e servizi connessi.
        </P>
        <P>
          L&apos;Informativa è resa ai sensi del Regolamento (UE) 2016/679 (&quot;GDPR&quot;), del D.Lgs. 196/2003 come
          modificato dal D.Lgs. 101/2018 (&quot;Codice Privacy&quot;) e delle Linee guida del Garante Privacy applicabili.
          Integra e non sostituisce i{' '}
          <Link href="/legal/condizioni" className="underline hover:text-white">
            Termini e Condizioni di Servizio
          </Link>
          , che regolano il rapporto contrattuale con l&apos;Utente.
        </P>
      </section>

      <section className="space-y-3">
        <H2>2. Titolare del trattamento</H2>
        <P>Il Titolare del trattamento dei dati personali è:</P>
        <div className="rounded-lg border border-white/20 bg-white/5 p-4 text-sm leading-relaxed">
          <p className="font-semibold text-white">{legalName}</p>
          <p>Forma giuridica: {legalForm}</p>
          <p>Sede legale: {legalAddress}</p>
          <p>P.IVA/C.F.: {vatNumber}</p>
          <p>Numero REA: {rea}</p>
          <p>
            Domicilio digitale / PEC:{' '}
            <a href={`mailto:${pec}`} className="underline hover:text-white">
              {pec}
            </a>
          </p>
        </div>
        <P>
          Per qualsiasi richiesta relativa alla protezione dei dati personali, incluso l&apos;esercizio dei diritti
          previsti dal GDPR, l&apos;interessato può contattare il Titolare all&apos;indirizzo PEC sopra indicato o tramite la
          pagina{' '}
          <Link href="/contatti" className="underline hover:text-white">
            Contattaci
          </Link>
          .
        </P>
        <P>
          Al momento non è stato nominato un Responsabile della Protezione dei Dati (DPO). Qualora la nomina venisse
          disposta, i relativi recapiti saranno pubblicati su questa pagina.
        </P>
      </section>

      <section className="space-y-3">
        <H2>3. Tipologie di dati personali trattati</H2>
        <P>
          A seconda delle funzionalità utilizzate, il Titolare può trattare le seguenti categorie di dati personali:
        </P>

        <H3>3.1. Dati identificativi e di contatto</H3>
        <Ul>
          <li>nome, cognome, username;</li>
          <li>indirizzo email;</li>
          <li>numero di telefono e prefisso internazionale;</li>
          <li>paese di residenza o sede;</li>
          <li>indirizzi di spedizione e fatturazione, ove forniti;</li>
          <li>per account business: ragione sociale, Partita IVA e dati fiscali.</li>
        </Ul>

        <H3>3.2. Dati di autenticazione e sicurezza</H3>
        <Ul>
          <li>password conservata esclusivamente in forma hashed (non in chiaro);</li>
          <li>token di sessione e credenziali di autenticazione (JWT RS256);</li>
          <li>eventuali codici MFA o dispositivi ricordati;</li>
          <li>log di accesso, tentativi di login, indirizzi IP e timestamp delle sessioni.</li>
        </Ul>

        <H3>3.3. Dati relativi all&apos;utilizzo della Piattaforma</H3>
        <Ul>
          <li>preferenze di lingua, tema e impostazioni dell&apos;account;</li>
          <li>cronologia di ricerca, query effettuate, filtri applicati e visualizzazioni di prodotti;</li>
          <li>inventari, annunci, offerte, ordini, aste, messaggi e notifiche;</li>
          <li>immagini, descrizioni e metadati caricati dall&apos;Utente per annunci o listing;</li>
          <li>dati tecnici di navigazione e utilizzo dei microservizi (Market, Sync, Search, Auth, Auctions).</li>
        </Ul>

        <H3>3.4. Dati di sincronizzazione con piattaforme terze</H3>
        <Ul>
          <li>token API, chiavi di accesso o credenziali fornite volontariamente dall&apos;Utente per attivare il Modulo Sync;</li>
          <li>dati di inventario, prezzi, disponibilità e metadati importati da servizi esterni collegati;</li>
          <li>log tecnici di sincronizzazione, code di elaborazione, webhook ricevuti e errori di parsing.</li>
        </Ul>
        <P>
          Tali credenziali sono archiviate dal Titolare esclusivamente in formato criptato tramite protocolli di
          crittografia simmetrica (chiavi Fernet), come indicato nei Termini di Servizio.
        </P>

        <H3>3.5. Dati di pagamento e transazioni</H3>
        <P>
          Ove previsto dalle funzionalità attive, possono essere trattati dati relativi a transazioni, crediti
          piattaforma, coupon, contestazioni e storico ordini. I dati delle carte di pagamento, ove gestiti da
          provider di pagamento esterni, sono trattati direttamente da tali soggetti secondo le rispettive informative.
        </P>

        <H3>3.6. Cookie e tecnologie simili</H3>
        <P>
          Per informazioni dettagliate su cookie, storage locale e tecnologie di tracciamento si rimanda alla{' '}
          <Link href="/legal/cookie" className="underline hover:text-white">
            Cookie Policy
          </Link>
          .
        </P>
      </section>

      <section className="space-y-3">
        <H2>4. Fonti dei dati</H2>
        <P>I dati personali possono essere ottenuti:</P>
        <Ul>
          <li>direttamente dall&apos;interessato, in fase di registrazione, configurazione account o utilizzo dei servizi;</li>
          <li>automaticamente, tramite l&apos;uso della Piattaforma (log tecnici, cookie, ricerche, interazioni);</li>
          <li>da piattaforme terze collegate dall&apos;Utente tramite il Modulo Sync, previa autorizzazione dell&apos;Utente stesso;</li>
          <li>da altri utenti della Piattaforma, limitatamente a quanto strettamente necessario allo svolgimento di transazioni, messaggi o contestazioni.</li>
        </Ul>
      </section>

      <section className="space-y-3">
        <H2>5. Finalità, base giuridica e natura del conferimento</H2>
        <P>I dati personali sono trattati per le finalità indicate di seguito:</P>

        <div className="overflow-x-auto rounded-lg border border-white/20">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-white/10">
              <tr>
                <th className="px-3 py-2 font-semibold text-white">Finalità</th>
                <th className="px-3 py-2 font-semibold text-white">Base giuridica</th>
                <th className="px-3 py-2 font-semibold text-white">Conferimento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              <tr>
                <td className="px-3 py-2 align-top">Registrazione, autenticazione e gestione dell&apos;account</td>
                <td className="px-3 py-2 align-top">Esecuzione del contratto (art. 6.1.b GDPR)</td>
                <td className="px-3 py-2 align-top">Necessario</td>
              </tr>
              <tr>
                <td className="px-3 py-2 align-top">Erogazione dei servizi di mercato, aste, ordini e messaggistica</td>
                <td className="px-3 py-2 align-top">Esecuzione del contratto (art. 6.1.b GDPR)</td>
                <td className="px-3 py-2 align-top">Necessario</td>
              </tr>
              <tr>
                <td className="px-3 py-2 align-top">Sincronizzazione inventari con piattaforme terze</td>
                <td className="px-3 py-2 align-top">Esecuzione del contratto (art. 6.1.b GDPR)</td>
                <td className="px-3 py-2 align-top">Facoltativo ma necessario per il servizio Sync</td>
              </tr>
              <tr>
                <td className="px-3 py-2 align-top">Motore di ricerca, indicizzazione e personalizzazione dell&apos;esperienza</td>
                <td className="px-3 py-2 align-top">Legittimo interesse (art. 6.1.f GDPR)</td>
                <td className="px-3 py-2 align-top">Automatico con l&apos;uso del servizio</td>
              </tr>
              <tr>
                <td className="px-3 py-2 align-top">Sicurezza, prevenzione frodi, antifrode e tutela della Piattaforma</td>
                <td className="px-3 py-2 align-top">Legittimo interesse (art. 6.1.f GDPR)</td>
                <td className="px-3 py-2 align-top">Automatico</td>
              </tr>
              <tr>
                <td className="px-3 py-2 align-top">Adempimenti di legge, contabili e fiscali</td>
                <td className="px-3 py-2 align-top">Obbligo di legge (art. 6.1.c GDPR)</td>
                <td className="px-3 py-2 align-top">Necessario ove applicabile</td>
              </tr>
              <tr>
                <td className="px-3 py-2 align-top">Comunicazioni di servizio, aggiornamenti tecnici e assistenza</td>
                <td className="px-3 py-2 align-top">Esecuzione del contratto / legittimo interesse</td>
                <td className="px-3 py-2 align-top">Necessario per il rapporto contrattuale</td>
              </tr>
              <tr>
                <td className="px-3 py-2 align-top">Cookie analitici o di profilazione non strettamente necessari</td>
                <td className="px-3 py-2 align-top">Consenso (art. 6.1.a GDPR)</td>
                <td className="px-3 py-2 align-top">Facoltativo</td>
              </tr>
              <tr>
                <td className="px-3 py-2 align-top">Marketing diretto, newsletter o comunicazioni promozionali</td>
                <td className="px-3 py-2 align-top">Consenso (art. 6.1.a GDPR) o legittimo interesse ove ammesso</td>
                <td className="px-3 py-2 align-top">Facoltativo</td>
              </tr>
              <tr>
                <td className="px-3 py-2 align-top">Test tecnico e miglioramento della versione Demo/Beta</td>
                <td className="px-3 py-2 align-top">Legittimo interesse / esecuzione del contratto</td>
                <td className="px-3 py-2 align-top">Inerente all&apos;uso della fase Demo</td>
              </tr>
            </tbody>
          </table>
        </div>

        <P>
          Il mancato conferimento dei dati contrassegnati come necessari può impedire la registrazione, l&apos;accesso ai
          servizi o il corretto funzionamento di specifiche funzionalità della Piattaforma.
        </P>
      </section>

      <section className="space-y-3">
        <H2>6. Modalità del trattamento e misure di sicurezza</H2>
        <P>
          I dati personali sono trattati con strumenti informatici e telematici, nel rispetto dei principi di liceità,
          correttezza, trasparenza, minimizzazione, accuratezza, limitazione della conservazione, integrità e
          riservatezza previsti dal GDPR.
        </P>
        <P>Il Titolare adotta misure tecniche e organizzative adeguate, tra cui:</P>
        <Ul>
          <li>autenticazione tramite crittografia asimmetrica JWT RS256;</li>
          <li>hashing irreversibile delle password;</li>
          <li>crittografia delle credenziali API/token inserite per la sincronizzazione;</li>
          <li>segregazione logica dei microservizi (Auth, Market, Sync, Search, Auctions);</li>
          <li>controllo degli accessi, logging tecnico e monitoraggio delle attività sospette;</li>
          <li>backup, ridondanza e procedure di ripristino compatibili con l&apos;architettura cloud adottata.</li>
        </Ul>
        <P>
          Nonostante le misure adottate, nessun sistema informatico può garantire sicurezza assoluta. L&apos;Utente è
          invitato a custodire con diligenza le proprie credenziali e a segnalare tempestivamente eventuali accessi non
          autorizzati.
        </P>
      </section>

      <section className="space-y-3">
        <H2>7. Conservazione dei dati</H2>
        <P>
          I dati personali sono conservati per il tempo strettamente necessario al perseguimento delle finalità per
          cui sono stati raccolti, salvo obblighi di legge diversi.
        </P>
        <Ul>
          <li>
            <strong>Dati dell&apos;account:</strong> per tutta la durata del rapporto contrattuale e, successivamente, per il
            periodo necessario a gestire eventuali contestazioni, obblighi legali o tutela dei diritti del Titolare.
          </li>
          <li>
            <strong>Dati di transazione e ordini:</strong> secondo i termini previsti dalla normativa civilistica,
            fiscale e contabile applicabile.
          </li>
          <li>
            <strong>Log tecnici e di sicurezza:</strong> per un periodo limitato e proporzionato alle esigenze di
            diagnosi, sicurezza e audit.
          </li>
          <li>
            <strong>Dati di ricerca e utilizzo:</strong> per il tempo necessario all&apos;ottimizzazione del motore di
            ricerca e all&apos;analisi aggregata delle performance, salvo cancellazione anticipata su richiesta
            dell&apos;interessato ove applicabile.
          </li>
          <li>
            <strong>Token di sincronizzazione:</strong> fino alla disattivazione del Modulo Sync o alla cancellazione
            dell&apos;account.
          </li>
        </Ul>
        <P>
          Trattandosi di una versione Demo/Beta della Piattaforma, il Titolare si riserva la facoltà di procedere a
          reset, cancellazione o non persistenza permanente dei dati, come meglio descritto nei Termini di Servizio.
        </P>
      </section>

      <section className="space-y-3">
        <H2>8. Comunicazione, diffusione e destinatari</H2>
        <P>
          I dati personali non sono oggetto di diffusione indiscriminata. Possono essere comunicati, nei limiti
          strettamente necessari, a:
        </P>
        <Ul>
          <li>personale autorizzato del Titolare, adeguatamente istruito e vincolato alla riservatezza;</li>
          <li>fornitori tecnologici, hosting provider, servizi cloud e infrastruttura (es. database PostgreSQL, MySQL, Redis, Meilisearch);</li>
          <li>provider di autenticazione, sicurezza, email transazionale e monitoraggio tecnico;</li>
          <li>piattaforme terze collegate volontariamente dall&apos;Utente tramite il Modulo Sync;</li>
          <li>altri utenti della Piattaforma, limitatamente a quanto necessario per completare transazioni, aste, messaggi o spedizioni;</li>
          <li>consulenti legali, fiscali, contabili o autorità competenti, ove richiesto dalla legge o per tutela in sede giudiziaria.</li>
        </Ul>
        <P>
          Tali soggetti operano come responsabili del trattamento ex art. 28 GDPR, autonomi titolari o controparti
          contrattuali dell&apos;Utente, a seconda della natura del servizio coinvolto.
        </P>
      </section>

      <section className="space-y-3">
        <H2>9. Trasferimenti verso Paesi extra-UE</H2>
        <P>
          Per l&apos;erogazione dei servizi, i dati possono essere trattati anche tramite infrastrutture o fornitori con sede
          al di fuori dello Spazio Economico Europeo. In tali casi, il Titolare adotta garanzie adeguate previste dal
          GDPR, quali Clausole Contrattuali Standard approvate dalla Commissione Europea, decisioni di adeguatezza o
          altri strumenti di tutela equivalenti.
        </P>
        <P>
          Per maggiori informazioni sui trasferimenti internazionali e sulle garanzie adottate, l&apos;interessato può
          contattare il Titolare ai recapiti indicati al punto 2.
        </P>
      </section>

      <section className="space-y-3">
        <H2>10. Processi automatizzati e profilazione</H2>
        <P>
          La Piattaforma utilizza sistemi automatizzati per indicizzare inventari, suggerire risultati di ricerca,
          ordinare contenuti e migliorare l&apos;esperienza d&apos;uso. Tali processi si basano su preferenze di mercato,
          cronologie di ricerca, interazioni con annunci e dati tecnici di utilizzo.
        </P>
        <P>
          Salvo diversa comunicazione specifica, non sono attivi processi decisionali automatizzati che producano
          effetti giuridici o incidano in modo analogo significativamente sull&apos;interessato ai sensi dell&apos;art. 22 GDPR.
        </P>
      </section>

      <section className="space-y-3">
        <H2>11. Servizi collegati e piattaforme esterne</H2>
        <P>
          La Piattaforma può contenere link o integrazioni verso servizi esterni, inclusi marketplace terzi, portali
          tornei (es.{' '}
          <a href="https://tornei.ebartex.com" className="underline hover:text-white" target="_blank" rel="noopener noreferrer">
            tornei.ebartex.com
          </a>
          ), provider di pagamento o strumenti di terze parti. Il trattamento effettuato da tali soggetti è regolato
          dalle rispettive informative privacy, sulle quali il Titolare non esercita controllo.
        </P>
        <P>
          L&apos;Utente che attiva il Modulo Sync autorizza espressamente il trattamento e la trasmissione dei dati
          necessari allo scambio con le piattaforme collegate, secondo le policy dei rispettivi operatori.
        </P>
      </section>

      <section className="space-y-3">
        <H2>12. Fase Demo / Beta Test</H2>
        <P>
          L&apos;Utente è informato che la versione attuale di {tradeName} è distribuita in modalità Demo/Beta Test. In tale
          fase i dati possono essere utilizzati anche per finalità di test tecnico, debug, ottimizzazione dei
          microservizi e verifica dell&apos;architettura di sistema.
        </P>
        <P>
          Non è garantita la persistenza permanente dei dati. Il Titolare può procedere, a propria discrezione, a reset
          parziali o totali dei database, cancellazione di account o interruzione di funzionalità, come previsto nei
          Termini di Servizio.
        </P>
      </section>

      <section className="space-y-3">
        <H2>13. Diritti dell&apos;interessato</H2>
        <P>
          In qualità di interessato, l&apos;Utente può esercitare in qualsiasi momento i diritti previsti dagli artt. 15-22
          GDPR, tra cui:
        </P>
        <Ul>
          <li>ottenere conferma dell&apos;esistenza dei dati e accesso agli stessi;</li>
          <li>richiedere la rettifica dei dati inesatti o l&apos;integrazione di quelli incompleti;</li>
          <li>richiedere la cancellazione dei dati, ove ne ricorrano i presupposti;</li>
          <li>ottenere la limitazione del trattamento;</li>
          <li>opporsi al trattamento fondato sul legittimo interesse, per motivi connessi alla propria situazione particolare;</li>
          <li>richiedere la portabilità dei dati forniti, ove applicabile;</li>
          <li>revocare il consenso prestato, senza pregiudicare la liceità del trattamento basato sul consenso prima della revoca;</li>
          <li>proporre reclamo all&apos;Autorità Garante per la Protezione dei Dati Personali.</li>
        </Ul>
        <P>
          Le richieste possono essere inviate a{' '}
          <a href={`mailto:${pec}`} className="underline hover:text-white">
            {pec}
          </a>{' '}
          o tramite la pagina{' '}
          <Link href="/contatti" className="underline hover:text-white">
            Contattaci
          </Link>
          . Il Titolare risponderà nei termini previsti dalla normativa applicabile e potrà richiedere informazioni
          aggiuntive per verificare l&apos;identità del richiedente.
        </P>
      </section>

      <section className="space-y-3">
        <H2>14. Reclamo all&apos;Autorità di controllo</H2>
        <P>
          Fatto salvo ogni altro ricorso amministrativo o giurisdizionale, l&apos;interessato ha diritto di proporre reclamo
          al Garante per la Protezione dei Dati Personali (
          <a href="https://www.garanteprivacy.it" className="underline hover:text-white" target="_blank" rel="noopener noreferrer">
            www.garanteprivacy.it
          </a>
          ) se ritiene che il trattamento dei propri dati personali violi il GDPR o la normativa nazionale applicabile.
        </P>
      </section>

      <section className="space-y-3">
        <H2>15. Minori</H2>
        <P>
          La Piattaforma non è destinata a minori di 18 anni. Il Titolare non raccoglie consapevolmente dati personali
          di minori. Qualora venisse riscontrato un trattamento non autorizzato di dati di minori, il Titolare
          provvederà alla cancellazione degli stessi e, ove necessario, alla chiusura dell&apos;account.
        </P>
      </section>

      <section className="space-y-3">
        <H2>16. Modifiche alla presente Informativa</H2>
        <P>
          Il Titolare può aggiornare la presente Informativa in qualsiasi momento, anche per adeguarla a modifiche
          normative, evoluzioni tecniche della Piattaforma o introduzione di nuove funzionalità. Le versioni aggiornate
          saranno pubblicate su questa pagina con indicazione della data di ultimo aggiornamento.
        </P>
        <P>
          Qualora le modifiche incidano in modo rilevante sui diritti dell&apos;interessato, il Titolare potrà informare gli
          utenti tramite avviso sulla Piattaforma o comunicazione email.
        </P>
      </section>

      <section className="space-y-3">
        <H2>17. Riferimenti utili</H2>
        <Ul>
          <li>
            <Link href="/legal/condizioni" className="underline hover:text-white">
              Termini e Condizioni di Servizio
            </Link>
          </li>
          <li>
            <Link href="/legal/cookie" className="underline hover:text-white">
              Cookie Policy
            </Link>
          </li>
          <li>
            <Link href="/legal/norme" className="underline hover:text-white">
              Norme legali
            </Link>
          </li>
          <li>
            <Link href="/contatti" className="underline hover:text-white">
              Contattaci
            </Link>
          </li>
        </Ul>
      </section>
    </div>
  );
}
