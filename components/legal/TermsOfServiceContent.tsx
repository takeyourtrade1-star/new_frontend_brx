import { COMPANY_INFO, TERMS_LAST_UPDATED, TERMS_PUBLISHED } from '@/lib/legal/company-info';
import {
  LegalP as P,
  LegalH2 as H2,
  LegalUl as Ul,
  LegalSection,
  LegalIntro,
  LegalCompanyCard,
  LegalInlineLink,
} from '@/components/legal/LegalTypography';

export function TermsOfServiceContent() {
  const { legalName, website, websiteUrl, legalAddress, pec, vatNumber, rea, legalForm } = COMPANY_INFO;

  return (
    <>
      <LegalIntro
        title="Termini e Condizioni di Servizio – Ebartex"
        published={TERMS_PUBLISHED}
        updated={TERMS_LAST_UPDATED}
      />

      <LegalSection>
        <P>
          I presenti Termini e Condizioni di Servizio (di seguito &quot;Termini&quot; o &quot;Contratto&quot;) disciplinano
          l&apos;accesso e l&apos;utilizzo della piattaforma Ebartex (di seguito &quot;Ebartex&quot; o &quot;Piattaforma&quot;), accessibile
          tramite l&apos;indirizzo{' '}
          <LegalInlineLink href={websiteUrl} external>
            {website}
          </LegalInlineLink>{' '}
          e i relativi sottodomini. La Piattaforma è di proprietà di e gestita da:
        </P>
        <LegalCompanyCard>
          <p className="font-display font-bold text-[#1D3160]">{legalName}</p>
          <p>Sede legale: {legalAddress}</p>
          <p>Forma giuridica: {legalForm}</p>
          <p>P.IVA/C.F.: {vatNumber}</p>
          <p>Numero REA: {rea}</p>
          <p>
            Domicilio digitale/PEC:{' '}
            <LegalInlineLink href={`mailto:${pec}`}>{pec}</LegalInlineLink>
          </p>
        </LegalCompanyCard>
        <P>(di seguito denominata il &quot;Fornitore&quot; o &quot;Società&quot;).</P>
      </LegalSection>

      <LegalSection>
        <H2>PREMESSA</H2>
        <P>
          L&apos;accesso, la registrazione e l&apos;utilizzo di Ebartex comportano l&apos;accettazione integrale e senza riserve
          dei presenti Termini da parte dell&apos;utente (di seguito &quot;Utente&quot;). Se l&apos;Utente non intende accettare i
          presenti Termini, è invitato a non utilizzare la Piattaforma.
        </P>
        <P>
          Ebartex è un ecosistema digitale complesso basato su un&apos;architettura a microservizi, progettato per
          offrire servizi di mercato, gestione inventari, aste in tempo reale e sincronizzazione di dati con
          piattaforme terze.
        </P>
        <P>
          L&apos;Utente dichiara di essere a conoscenza che l&apos;attuale versione di Ebartex è rilasciata in modalità
          &quot;Demo&quot; (Beta Test), come meglio specificato all&apos;Articolo 2, e accetta i rischi tecnici connessi a tale
          fase di sviluppo.
        </P>
      </LegalSection>

      <LegalSection>
        <H2>ARTICOLO 1 – OGGETTO DEL CONTRATTO E DEFINIZIONI</H2>
        <P>
          <strong>1.1. Oggetto.</strong> Il presente Contratto definisce le condizioni alle quali il Fornitore mette a
          disposizione dell&apos;Utente l&apos;accesso ai propri microservizi tecnologici, inclusi ma non limitati a:
        </P>
        <Ul>
          <li><strong>Mercato (Market):</strong> Spazio virtuale per l&apos;esposizione e lo scambio di beni collezionabili.</li>
          <li><strong>Sistema di Aste (Bidding System):</strong> Funzionalità di offerte in tempo reale gestite tramite sistemi di caching ad alte prestazioni (Redis).</li>
          <li><strong>Modulo di Sincronizzazione (Sync):</strong> Strumento per il collegamento e l&apos;aggiornamento asincrono di inventari ospitati su piattaforme di terze parti.</li>
          <li><strong>Ricerca (Search):</strong> Motore di indicizzazione avanzato per la consultazione dei beni.</li>
        </Ul>
        <P>
          <strong>1.2. Ruolo di Ebartex.</strong> Ebartex agisce esclusivamente come fornitore di infrastruttura tecnologica e
          intermediario tecnico. Il Fornitore non è parte dei contratti di compravendita o delle transazioni
          concluse tra gli Utenti, né agisce come casa d&apos;aste in senso giuridico, limitandosi a fornire il
          software per la gestione delle offerte.
        </P>
        <P><strong>1.3. Definizioni Specifiche.</strong></P>
        <Ul>
          <li><strong>Credenziali API / Token:</strong> Codici di autorizzazione forniti da terze parti che l&apos;Utente decide di inserire in Ebartex per attivare la sincronizzazione.</li>
          <li><strong>Overselling:</strong> Situazione di vendita eccedente la reale disponibilità, derivante da ritardi tecnici nella sincronizzazione tra piattaforme diverse.</li>
        </Ul>
      </LegalSection>

      <LegalSection>
        <H2>ARTICOLO 2 – NATURA DEL SERVIZIO - AMBIENTE &quot;DEMO&quot; (Beta Test)</H2>
        <P>
          <strong>2.1. Carattere Sperimentale.</strong> L&apos;Utente prende atto che Ebartex è attualmente distribuita in versione
          &quot;Demo&quot; (Beta Test). Tale versione è finalizzata esclusivamente al test delle funzionalità tecniche e
          dell&apos;architettura a microservizi.
        </P>
        <P>
          <strong>2.2. Limitazioni Tecniche e Uptime.</strong> Il Fornitore non garantisce la continuità operativa né l&apos;uptime
          del 100%. Il servizio può essere soggetto a interruzioni, rallentamenti o malfunzionamenti derivanti
          dalla natura sperimentale del software o da interventi di manutenzione evolutiva.
        </P>
        <P>
          <strong>2.3. Persistenza dei Dati e Reset.</strong> La piattaforma non garantisce la persistenza permanente dei dati.
          Il Fornitore si riserva espressamente il diritto, in qualsiasi momento e a propria esclusiva
          discrezione, di:
        </P>
        <Ul>
          <li>procedere al reset totale o parziale dei database (con conseguente cancellazione di inventari, offerte, messaggi e configurazioni);</li>
          <li>sospendere o interrompere definitivamente specifiche funzionalità o l&apos;intero servizio;</li>
          <li>modificare l&apos;interfaccia e le logiche di sistema senza alcun obbligo di preavviso.</li>
        </Ul>
        <P>
          <strong>2.4. Esclusione di Responsabilità.</strong> In nessun caso il Fornitore potrà essere ritenuto responsabile per
          danni diretti o indiretti, inclusi ma non limitati a: perdita di dati, perdita di profitti, interruzione di
          attività commerciale o perdita di opportunità di vendita derivanti dall&apos;utilizzo, dal
          malfunzionamento o dal reset della versione Demo di Ebartex. L&apos;Utente utilizza la Piattaforma a
          proprio rischio e pericolo.
        </P>
      </LegalSection>

      <LegalSection>
        <H2>ARTICOLO 3 – REGISTRAZIONE, SICUREZZA E CREDENZIALI</H2>
        <P>
          <strong>3.1. Creazione dell&apos;Account.</strong> Per accedere ai Servizi, l&apos;Utente deve registrarsi fornendo dati
          anagrafici veritieri, un indirizzo email valido e scegliendo le proprie credenziali di accesso. L&apos;uso di
          dati falsi comporta la chiusura immediata dell&apos;account.
        </P>
        <P><strong>3.2. Tecnologia di Protezione.</strong> Ebartex adotta misure di sicurezza avanzate per la protezione dell&apos;accesso:</P>
        <Ul>
          <li>L&apos;autenticazione è gestita tramite crittografia asimmetrica (standard JWT RS256), garantendo che i dati sensibili non viaggino in chiaro durante le sessioni.</li>
          <li>Le password vengono archiviate esclusivamente tramite algoritmi di hashing irreversibile.</li>
        </Ul>
        <P>
          <strong>3.3. Responsabilità dell&apos;Utente.</strong> Nonostante le misure di sicurezza adottate dalla Piattaforma,
          l&apos;Utente è l&apos;unico responsabile della riservatezza delle proprie credenziali. Qualsiasi azione
          compiuta tramite l&apos;account dell&apos;Utente sarà attribuita allo stesso. L&apos;Utente si impegna a notificare
          immediatamente al Fornitore qualsiasi sospetto di uso non autorizzato del proprio account o
          violazione della sicurezza.
        </P>
        <P>
          <strong>3.4. Chiusura e Sospensione.</strong> Il Fornitore si riserva il diritto di sospendere o cancellare l&apos;account
          dell&apos;Utente in caso di violazione dei presenti Termini o qualora l&apos;attività dell&apos;Utente possa
          compromettere la stabilità e la sicurezza dell&apos;architettura a microservizi di Ebartex.
        </P>
      </LegalSection>

      <LegalSection>
        <H2>ARTICOLO 4 – MODULO DI SINCRONIZZAZIONE (SYNC), API DI TERZE PARTI E LIMITAZIONI DI RESPONSABILITÀ TECNICA</H2>
        <P>
          <strong>4.1. Descrizione e Funzionamento.</strong> Ebartex mette a disposizione un modulo di sincronizzazione
          asincrona (di seguito &quot;Modulo Sync&quot;) che permette all&apos;Utente di collegare i propri account su
          piattaforme esterne per importare e aggiornare automaticamente inventari, prezzi e disponibilità. Il
          servizio opera tramite processi in background (Celery Worker), sistemi di gestione code (Redis) e
          ricezione di notifiche istantanee (Webhooks).
        </P>
        <P>
          <strong>4.2. Gestione Token e Sicurezza (Crittografia).</strong> Per attivare il Modulo Sync, l&apos;Utente deve inserire
          le proprie credenziali API o &quot;Token&quot; rilasciati dai servizi terzi.
        </P>
        <Ul>
          <li><strong>Protocolli di Sicurezza.</strong> Ebartex archivia tali chiavi nei propri database esclusivamente in formato criptato tramite protocolli di crittografia simmetrica (chiavi Fernet).</li>
          <li><strong>Assunzione del Rischio.</strong> L&apos;inserimento del Token è una scelta volontaria dell&apos;Utente. Ebartex non potrà essere ritenuta responsabile per accessi abusivi ai dati o alle API Key derivanti da: (a) compromissione delle credenziali dell&apos;Utente; (b) violazioni di sicurezza subite dai server delle piattaforme terze; (c) intrusioni informatiche che esulano dal controllo diretto del Fornitore.</li>
        </Ul>
        <P>
          <strong>4.3. Interdipendenza da Servizi Terzi e Continuità.</strong> L&apos;Utente riconosce che il funzionamento del
          Modulo Sync dipende totalmente dalla disponibilità e dalle politiche tecniche di soggetti esterni.
        </P>
        <Ul>
          <li><strong>Modifiche e Interruzioni.</strong> Qualora una piattaforma terza modifichi le proprie API, revochi l&apos;accesso ai Token, cambi le proprie policy o subisca periodi di inattività (down), il Modulo Sync di Ebartex cesserà di funzionare in tutto o in parte.</li>
          <li><strong>Esclusione di Obbligo.</strong> Ebartex non ha alcun obbligo di garantire la continuità dell&apos;integrazione con servizi non di sua proprietà e non risponde di eventuali danni o perdite derivanti da decisioni unilaterali di tali soggetti terzi.</li>
        </Ul>
        <P>
          <strong>4.4. Asincronia, Latenza e Rischio di &quot;Overselling&quot;.</strong> La sincronizzazione dei dati non avviene in
          tempo reale assoluto ma è soggetta a fisiologici ritardi tecnici di elaborazione.
        </P>
        <Ul>
          <li><strong>Discrepanze Temporali.</strong> L&apos;Utente accetta il rischio di discrepanze temporali (latenza) tra i dati visualizzati su Ebartex e quelli sulle piattaforme collegate.</li>
          <li><strong>Vendite Doppie.</strong> Il Fornitore declina ogni responsabilità per vendite doppie (overselling), mancate vendite o sanzioni applicate da siti terzi causate da ritardi nella ricezione dei Webhook o nella gestione delle code di lavoro. L&apos;Utente è consapevole che, a titolo esemplificativo, un oggetto venduto su Ebartex potrebbe risultare ancora disponibile su una piattaforma terza per un intervallo tecnico (es. 30-60 secondi), e viceversa.</li>
        </Ul>
        <P>
          <strong>4.5. Errori di Parsing, Bug e Gestione dei Prezzi.</strong> Il sistema di sincronizzazione automatizzata
          potrebbe generare errori derivanti da bug temporanei, malfunzionamenti del codice o errata
          interpretazione (parsing) dei file di origine delle terze parti.
        </P>
        <Ul>
          <li><strong>Esclusione di Rimborso.</strong> Ebartex non risponde di errori di prezzo (es. articoli pubblicati a prezzi sballati o irrisori) o errori di quantità causati da anomalie del software o dalla latenza di rete. Tali errori non sono in alcun caso rimborsabili o imputabili al Fornitore.</li>
        </Ul>
        <P>
          <strong>4.6. Onere di Monitoraggio a carico dell&apos;Utente.</strong> L&apos;Utente rimane l&apos;unico e ultimo responsabile
          della gestione e del controllo del proprio inventario. È dovere dell&apos;Utente verificare
          quotidianamente la correttezza dei dati sincronizzati e intervenire manualmente in caso di anomalie,
          sospendendo la sincronizzazione qualora riscontri errori persistenti.
        </P>
      </LegalSection>

      <LegalSection>
        <H2>ARTICOLO 5 – FUNZIONAMENTO DEL MERCATO E DELLE ASTE (BIDDING SYSTEM)</H2>
        <P>
          <strong>5.1. Pubblicazione degli Annunci.</strong> L&apos;Utente può pubblicare annunci per lo scambio o la vendita di
          beni (es. carte collezionabili), definendo prezzi e condizioni. L&apos;Utente garantisce di avere la piena
          disponibilità e titolarità dei beni offerti.
        </P>
        <P>
          <strong>5.2. Sistema di Aste in Tempo Reale.</strong> Ebartex mette a disposizione un sistema di offerte (Bidding
          System) gestito tramite un&apos;architettura di microservizi dedicata e sistemi di caching ad alta velocità
          (Redis). Ciò consente la gestione di offerte concorrenti in tempi rapidi.
        </P>
        <P>
          <strong>5.3. Vincolatività dell&apos;Offerta.</strong> Ogni offerta formulata durante un&apos;asta o ogni conferma di acquisto
          nel mercato a prezzo fisso costituisce un impegno contrattuale vincolante tra l&apos;Utente Acquirente e
          l&apos;Utente Venditore. L&apos;Utente non può revocare un&apos;offerta valida una volta inserita nel sistema.
        </P>
        <P>
          <strong>5.4. Latenza e Caching.</strong> Nonostante l&apos;uso di tecnologie di caching veloce, l&apos;Utente accetta che
          possano verificarsi millisecondi di latenza. In caso di offerte simultanee, farà fede esclusivamente il
          log temporale registrato sui server di Ebartex. Il Fornitore non è responsabile per offerte non
          pervenute o elaborate in ritardo a causa di problemi di connessione dell&apos;Utente o congestione della
          rete.
        </P>
      </LegalSection>

      <LegalSection>
        <H2>ARTICOLO 6 – RUOLO DI EBARTEX COME INTERMEDIARIO TECNOLOGICO</H2>
        <P>
          <strong>6.1. Natura dell&apos;Intermediazione.</strong> Ebartex agisce esclusivamente come fornitore di infrastruttura
          tecnologica. La Piattaforma facilita l&apos;incontro tra domanda e offerta, ma non entra mai a far parte
          della transazione. Qualsiasi accordo, compravendita o asta conclusa tramite Ebartex è un contratto
          stipulato direttamente ed esclusivamente tra gli Utenti coinvolti.
        </P>
        <P>
          <strong>6.2. Esclusione di Responsabilità sulla Qualità.</strong> Ebartex non ha il possesso dei beni, non ne
          verifica l&apos;autenticità, lo stato di conservazione (grading), la qualità o la conformità rispetto alla
          descrizione fornita dal venditore. Il Fornitore declina ogni responsabilità per vizi, difetti o
          difformità dei beni scambiati.
        </P>
        <P>
          <strong>6.3. Inadempimento e Mancati Pagamenti.</strong> Il Fornitore non garantisce l&apos;adempimento delle
          obbligazioni assunte dagli Utenti. In particolare, Ebartex non è responsabile per il mancato
          pagamento da parte dell&apos;acquirente al termine di un&apos;asta o per la mancata spedizione del bene da
          parte del venditore. La risoluzione di eventuali controversie relative al pagamento o alla consegna
          resta onere esclusivo delle parti coinvolte.
        </P>
        <P>
          <strong>6.4. Tutela contro le Frodi.</strong> Sebbene Ebartex si riservi il diritto di sospendere account segnalati per
          attività sospette, il Fornitore non risponde di eventuali frodi, raggiri o comportamenti illeciti messi
          in atto dagli Utenti a danno di altri partecipanti. L&apos;Utente è tenuto ad adottare la normale diligenza
          nel valutare le controparti.
        </P>
      </LegalSection>

      <LegalSection>
        <H2>ARTICOLO 7 – UTILIZZO CONSENTITO E CONDOTTA DELL&apos;UTENTE</H2>
        <P>
          <strong>7.1. Uso Lecito.</strong> L&apos;Utente si impegna a utilizzare Ebartex esclusivamente per scopi leciti e in
          conformità con i presenti Termini. È vietata qualsiasi forma di utilizzo che possa danneggiare,
          disabilitare o sovraccaricare l&apos;infrastruttura a microservizi della Piattaforma.
        </P>
        <P>
          <strong>7.2. Divieto di Scraping e Automazione.</strong> È categoricamente vietato l&apos;utilizzo di sistemi
          automatizzati (inclusi spider, robot, scraper, offline reader) per accedere alla Piattaforma e prelevare
          dati, inventari o prezzi, a meno che non sia espressamente autorizzato dal Fornitore tramite API
          ufficiali.
        </P>
        <P>
          <strong>7.3. Integrità Tecnica.</strong> L&apos;Utente non deve tentare di aggirare le misure di sicurezza, effettuare
          reverse engineering del software o interferire con il corretto funzionamento dei microservizi (Auth,
          Market, Sync, Search). Ogni tentativo di intrusione o test di vulnerabilità non autorizzato sarà
          segnalato alle autorità competenti.
        </P>
        <P>
          <strong>7.4. Contenuti Inappropriati.</strong> È vietato pubblicare annunci, messaggi o immagini che siano
          offensivi, fraudolenti, o che violino diritti di proprietà intellettuale di terzi. Il Fornitore si riserva il
          diritto di rimuovere tali contenuti senza preavviso.
        </P>
      </LegalSection>

      <LegalSection>
        <H2>ARTICOLO 8 – PROPRIETÀ INTELLETTUALE E CONTENUTI DELL&apos;UTENTE</H2>
        <P>
          <strong>8.1. Diritti sulla Piattaforma.</strong> Tutti i diritti di proprietà intellettuale relativi a Ebartex (software,
          design, loghi, algoritmi di sincronizzazione e database) appartengono in via esclusiva al Fornitore.
        </P>
        <P>
          <strong>8.2. Contenuti caricati dall&apos;Utente.</strong> L&apos;Utente mantiene la proprietà dei contenuti (es., foto delle
          carte, descrizioni) caricati sulla Piattaforma. Tuttavia, caricando tali contenuti, l&apos;Utente concede a
          Ebartex una licenza d&apos;uso gratuita, globale e non esclusiva per visualizzare, memorizzare,
          indicizzare e utilizzare tali dati al fine di erogare i Servizi e ottimizzare il motore di ricerca.
        </P>
        <P>
          <strong>8.3. Database e Cataloghi:</strong> L&apos;organizzazione, la struttura e l&apos;indicizzazione dei dati degli inventari
          all&apos;interno dei database di Ebartex costituiscono un&apos;opera protetta. È vietata la riproduzione anche
          parziale del catalogo di Ebartex all&apos;esterno della Piattaforma senza consenso scritto.
        </P>
      </LegalSection>

      <LegalSection>
        <H2>ARTICOLO 9 – TRACCIAMENTO, RICERCA E PRIVACY</H2>
        <P>
          <strong>9.1. Funzionamento del Motore di Ricerca.</strong> L&apos;Utente prende atto che, per garantire un&apos;esperienza
          d&apos;uso fluida, le sue azioni (ricerche effettuate, visualizzazioni di prodotti, gestione dell&apos;inventario)
          vengono indicizzate in tempo reale tramite database dedicati (PostgreSQL per le transazioni,
          MySQL e Meilisearch per le funzionalità di ricerca rapida).
        </P>
        <P><strong>9.2. Finalità del Tracciamento.</strong> I dati relativi alle preferenze di mercato e alle cronologie di ricerca vengono salvati e analizzati per:</P>
        <Ul>
          <li>ottimizzare l&apos;algoritmo di indicizzazione dei beni;</li>
          <li>personalizzare l&apos;esperienza utente e suggerire contenuti rilevanti;</li>
          <li>migliorare le prestazioni tecniche dei microservizi di ricerca.</li>
        </Ul>
        <P>
          <strong>9.3. Privacy e Sicurezza dei Dati:</strong> Il trattamento dei dati avviene nel rispetto della normativa
          vigente (GDPR, ove applicabile). Per i dettagli sulla conservazione dei dati, l&apos;esercizio dei diritti
          dell&apos;interessato e la gestione tecnica dei log, si rimanda alla{' '}
          <LegalInlineLink href="/legal/privacy">
            Privacy Policy
          </LegalInlineLink>{' '}
          integrale della Piattaforma. L&apos;Utente accetta che i dati raccolti nella fase
          Demo siano trattati per le finalità tecniche e di test sopra descritte.
        </P>
      </LegalSection>

      <LegalSection>
        <H2>ARTICOLO 10 – LIMITAZIONI GENERALI DI RESPONSABILITÀ E MANLEVA</H2>
        <P>
          <strong>10.1. Esclusione di Danni Indiretti.</strong> Nei limiti massimi consentiti dalla legge applicabile, il
          Fornitore non sarà in alcun caso responsabile verso l&apos;Utente o terzi per danni indiretti, incidentali,
          speciali, punitivi o consequenziali. Questa esclusione include, a titolo esemplificativo: perdita di
          profitti (lucro cessante), perdita di dati, interruzione di attività, danni reputazionali o costi di
          sostituzione di beni, anche qualora il Fornitore sia stato informato della possibilità di tali danni.
        </P>
        <P>
          <strong>10.2. Responsabilità per Servizi Terzi.</strong> Ebartex declina ogni responsabilità per malfunzionamenti,
          violazioni di dati o modifiche unilaterali apportate dalle piattaforme terze collegate tramite il
          Modulo Sync. L&apos;Utente riconosce che il rapporto con tali piattaforme è regolato da termini
          contrattuali distinti e indipendenti da quelli di Ebartex.
        </P>
        <P><strong>10.3. Clausola di Manleva.</strong> L&apos;Utente si impegna a manlevare, difendere e tenere indenne il Fornitore, i suoi collaboratori e i suoi fornitori di servizi da qualsiasi pretesa, danno, perdita, responsabilità, costo o spesa (incluse le spese legali) derivanti da:</P>
        <Ul>
          <li>violazione dei presenti Termini da parte dell&apos;Utente;</li>
          <li>utilizzo improprio della Piattaforma o delle funzionalità di sincronizzazione;</li>
          <li>violazione di diritti di terzi (inclusi diritti di proprietà intellettuale o norme sulla protezione dei dati);</li>
          <li>dispute relative a transazioni, vendite o aste concluse con altri Utenti.</li>
        </Ul>
      </LegalSection>

      <LegalSection id="cancellazione">
        <H2>ARTICOLO 11 – SOSPENSIONE, CHIUSURA ACCOUNT E RECESSO</H2>
        <P>
          <strong>11.1. Recesso dell&apos;Utente:</strong> L&apos;Utente ha il diritto di recedere dal presente Contratto in qualsiasi
          momento, cessando l&apos;utilizzo della Piattaforma e richiedendo la cancellazione del proprio account
          tramite le impostazioni del profilo o inviando una comunicazione al Fornitore.
        </P>
        <P>
          <strong>11.2. Sospensione e Risoluzione per Inadempimento.</strong> Il Fornitore si riserva il diritto di sospendere
          o chiudere l&apos;account dell&apos;Utente immediatamente e senza preavviso in caso di:
        </P>
        <Ul>
          <li>violazione di una qualsiasi delle clausole dei presenti Termini;</li>
          <li>utilizzo della Piattaforma per scopi fraudolenti, illegali o contrari alla buona fede;</li>
          <li>azioni che possano compromettere la stabilità tecnica dei microservizi o la sicurezza dei dati degli altri Utenti;</li>
          <li>Inattività prolungata dell&apos;account (superiore a 12 mesi).</li>
        </Ul>
        <P>
          <strong>11.3. Chiusura Discrezionale (Fase Demo).</strong> Trattandosi di un ambiente in fase di test, il Fornitore
          si riserva il diritto di chiudere la Piattaforma o singoli account in qualsiasi momento e a propria
          esclusiva discrezione, senza dover fornire giustificazioni e senza che ciò comporti alcun diritto a
          indennizzi o rimborsi per l&apos;Utente.
        </P>
        <P>
          <strong>11.4. Effetti della Chiusura.</strong> La chiusura dell&apos;account comporta la disattivazione immediata del
          Modulo Sync e la cessazione dell&apos;esposizione degli annunci. Restano comunque salve le
          obbligazioni assunte dall&apos;Utente nei confronti di altri Utenti prima della chiusura e le clausole dei
          presenti Termini destinate per loro natura a sopravvivere alla risoluzione del contratto (es. proprietà
          intellettuale, manleva e limitazioni di responsabilità).
        </P>
      </LegalSection>

      <LegalSection>
        <H2>ARTICOLO 12 – MODIFICHE AI TERMINI E VALIDITÀ</H2>
        <P>
          <strong>12.1. Diritto di Modifica.</strong> Il Fornitore si riserva il diritto di modificare, aggiornare o integrare i
          presenti Termini in qualsiasi momento, in particolare per adeguarli a nuove funzionalità tecniche
          (es. rilascio di nuovi microservizi), a mutate condizioni di mercato o a nuovi obblighi di legge.
        </P>
        <P>
          <strong>12.2. Comunicazione delle Modifiche.</strong> Le modifiche saranno rese note agli Utenti tramite avviso
          sulla Piattaforma o via email. L&apos;utilizzo continuativo di Ebartex a seguito della pubblicazione delle
          modifiche costituisce accettazione integrale dei nuovi Termini. Qualora l&apos;Utente non intenda
          accettare le variazioni, è tenuto a cessare l&apos;uso del servizio e chiudere il proprio account.
        </P>
        <P>
          <strong>12.3. Clausola di Salvaguardia.</strong> Qualora una o più clausole dei presenti Termini venissero
          dichiarate nulle, invalide o inapplicabili da un&apos;autorità giudiziaria, tale nullità non pregiudicherà la
          validità e l&apos;efficacia delle restanti disposizioni, che continueranno a produrre pieni effetti.
        </P>
      </LegalSection>

      <LegalSection>
        <H2>ARTICOLO 13 – LEGGE APPLICABILE E FORO COMPETENTE</H2>
        <P>
          <strong>13.1. Legge Applicabile.</strong> I presenti Termini e ogni controversia relativa all&apos;interpretazione,
          esecuzione o validità del contratto tra l&apos;Utente e il Fornitore sono regolati esclusivamente dalla
          legge italiana.
        </P>
        <P>
          <strong>13.2. Risoluzione delle Controversie.</strong> Per ogni controversia derivante dall&apos;utilizzo della
          Piattaforma o relativa ai presenti Termini, le parti si impegnano a cercare preventivamente una
          soluzione amichevole tramite i sistemi di mediazione disponibili.
        </P>
        <P><strong>13.3. Foro Competente.</strong></P>
        <Ul>
          <li>Qualora l&apos;Utente agisca in qualità di Consumatore (persona fisica che agisce per scopi estranei all&apos;attività imprenditoriale o professionale), il foro competente sarà quello del luogo di residenza o domicilio dell&apos;Utente, come previsto dalla normativa vigente.</li>
          <li>Qualora l&apos;Utente agisca in qualità di Professionista o Imprenditore, le parti stabiliscono la competenza esclusiva del Foro di Ivrea.</li>
        </Ul>
      </LegalSection>

      <LegalSection id="clausole-vessatorie">
        <P>
          L&apos;Utente dichiara di aver letto e compreso integralmente i presenti Termini e Condizioni di Servizio.
          L&apos;utilizzo della Piattaforma, la registrazione di un account o l&apos;attivazione del Modulo Sync
          costituiscono accettazione piena e incondizionata del presente Contratto.
        </P>
        <P>
          Ai sensi e per gli effetti degli artt. 1341 e 1342 del Codice Civile italiano, l&apos;Utente dichiara di aver
          letto con particolare attenzione e di approvare specificamente le seguenti clausole:
        </P>
        <Ul>
          <li><strong>Articolo 2 (Natura del Servizio - Ambiente &quot;Demo&quot;):</strong> Esclusione di garanzie, diritto di reset dei database, sospensione del servizio e limitazione di responsabilità del Fornitore per malfunzionamenti della versione Beta.</li>
          <li><strong>Articolo 4 (Modulo Sync e API Terze):</strong> Limitazione di responsabilità per furto o perdita di Token, esclusione di responsabilità per &quot;overselling&quot;, latenza, ritardi tecnici dei Webhook e per errori di prezzo o parsing derivanti da bug del software o integrazioni terze.</li>
          <li><strong>Articolo 6 (Intermediario Tecnologico):</strong> Esclusione totale di responsabilità del Fornitore per la qualità dei beni, frodi tra utenti, mancati pagamenti o inadempimenti contrattuali nelle transazioni tra privati.</li>
          <li><strong>Articolo 10 (Limitazioni di Responsabilità e Manleva):</strong> Esclusione di danni indiretti e lucro cessante; obbligo dell&apos;utente di tenere indenne il Fornitore da pretese legali di terzi.</li>
          <li><strong>Articolo 11 (Chiusura Discrezionale):</strong> Diritto del Fornitore di chiudere o sospendere l&apos;account e la Piattaforma in qualsiasi momento e a propria esclusiva discrezione senza obbligo di indennizzo.</li>
          <li><strong>Articolo 12 (Modifiche ai Termini):</strong> Diritto del Fornitore di modificare unilateralmente il Contratto.</li>
          <li><strong>Articolo 13 (Legge e Foro):</strong> Scelta della legge italiana e designazione del Foro di Ivrea come foro esclusivo per i professionisti.</li>
        </Ul>
      </LegalSection>
    </>
  );
}
